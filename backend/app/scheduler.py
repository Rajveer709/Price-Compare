import asyncio
import logging
import pytz
from datetime import datetime, time as dt_time, timedelta
from typing import Dict, List, Optional, Any, Callable, Awaitable, Union

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.job import Job

from .config import settings
from .notifier import notifier

logger = logging.getLogger(__name__)

class TaskScheduler:
    """Manages scheduled tasks using APScheduler."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=pytz.utc)
        self.jobs: Dict[str, Job] = {}
        self._initialized = False
    
    async def initialize(self):
        """Initialize the scheduler with default jobs."""
        if self._initialized:
            return
            
        # Add default jobs
        await self.add_job(
            id="daily_scrape",
            func=self._daily_scrape_task,
            trigger=CronTrigger.from_crontab(
                f"{settings.DAILY_SCRAPE_TIME.split(':')[1]} {settings.DAILY_SCRAPE_TIME.split(':')[0]} * * *",
                timezone=settings.SCHEDULER_TIMEZONE
            ),
            name="Daily Price Scraping",
            description="Runs the daily price scraping job"
        )
        
        # Add a cleanup job to run every day at 3 AM
        await self.add_job(
            id="daily_cleanup",
            func=self._cleanup_task,
            trigger=CronTrigger(hour=3, minute=0, timezone=settings.SCHEDULER_TIMEZONE),
            name="Daily Cleanup",
            description="Performs daily cleanup tasks"
        )
        
        self._initialized = True
        logger.info("Scheduler initialized with default jobs")
    
    async def start(self):
        """Start the scheduler."""
        if not self.scheduler.running:
            await self.initialize()
            self.scheduler.start()
            logger.info("Scheduler started")
            
            # Send notification
            await notifier.send_notification(
                "Price comparison scheduler has started",
                "Scheduler Started",
                "info"
            )
    
    async def shutdown(self):
        """Shutdown the scheduler gracefully."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler has been shut down")
    
    async def add_job(
        self,
        id: str,
        func: Union[Callable, str],
        trigger: Any = None,
        args: Optional[tuple] = None,
        kwargs: Optional[dict] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        replace_existing: bool = True,
        **trigger_args
    ) -> Optional[Job]:
        """Add a job to the scheduler.
        
        Args:
            id: Unique identifier for the job
            func: Callable or import path to the function to run
            trigger: Trigger that determines when the job runs
            args: Arguments to pass to the function
            kwargs: Keyword arguments to pass to the function
            name: Name of the job
            description: Description of the job
            replace_existing: Whether to replace existing job with the same ID
            **trigger_args: Additional trigger arguments
            
        Returns:
            The scheduled Job instance, or None if job was not added
        """
        if args is None:
            args = ()
        if kwargs is None:
            kwargs = {}
            
        # Check if job already exists
        existing_job = self.scheduler.get_job(id)
        if existing_job:
            if not replace_existing:
                logger.warning(f"Job with id '{id}' already exists and replace_existing is False")
                return None
            logger.info(f"Replacing existing job with id: {id}")
        
        # Create the job
        job = self.scheduler.add_job(
            func=func,
            trigger=trigger,
            args=args,
            kwargs=kwargs,
            id=id,
            name=name,
            **trigger_args
        )
        
        # Store the job in our dictionary
        self.jobs[id] = job
        
        logger.info(f"Added job: {id} ({name})")
        return job
    
    async def remove_job(self, job_id: str) -> bool:
        """Remove a job from the scheduler.
        
        Args:
            job_id: ID of the job to remove
            
        Returns:
            bool: True if job was removed, False otherwise
        """
        job = self.scheduler.get_job(job_id)
        if job:
            job.remove()
            self.jobs.pop(job_id, None)
            logger.info(f"Removed job: {job_id}")
            return True
        return False
    
    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a job.
        
        Args:
            job_id: ID of the job to get
            
        Returns:
            Dictionary with job information, or None if not found
        """
        job = self.scheduler.get_job(job_id)
        if not job:
            return None
            
        return self._format_job(job)
    
    async def list_jobs(self) -> List[Dict[str, Any]]:
        """Get a list of all scheduled jobs.
        
        Returns:
            List of dictionaries with job information
        """
        jobs = self.scheduler.get_jobs()
        return [self._format_job(job) for job in jobs]
    
    def _format_job(self, job: Job) -> Dict[str, Any]:
        """Format job information into a dictionary."""
        next_run = job.next_run_time.isoformat() if job.next_run_time else None
        
        return {
            "id": job.id,
            "name": job.name,
            "description": job.description,
            "next_run": next_run,
            "trigger": str(job.trigger),
            "pending": job.pending,
            "paused": not bool(next_run)
        }
    
    async def _daily_scrape_task(self):
        """Task that runs the daily price scraping."""
        from .scraper_engine import ScraperEngine  # Import here to avoid circular imports
        
        logger.info("Starting daily price scraping task")
        
        try:
            # Initialize the scraper
            scraper = ScraperEngine(headless=True)
            await scraper.start()
            
            # TODO: Load target URLs from database or configuration
            target_urls = [
                # Add your target URLs here
            ]
            
            # Process each URL
            for url in target_urls:
                try:
                    logger.info(f"Scraping URL: {url}")
                    # TODO: Implement actual scraping logic
                    # await scraper.navigate(url)
                    # data = await scraper.extract_data()
                    # await storage.save_product(data, source=urlparse(url).netloc)
                    pass
                except Exception as e:
                    logger.error(f"Error scraping {url}: {e}")
                    await notifier.send_notification(
                        f"Error scraping {url}",
                        "Scraping Error",
                        "error",
                        {"error": str(e), "url": url}
                    )
            
            logger.info("Daily price scraping completed")
            
            # Send success notification
            await notifier.send_notification(
                "Daily price scraping completed successfully",
                "Scraping Complete",
                "success"
            )
            
        except Exception as e:
            logger.error(f"Error in daily scrape task: {e}")
            
            # Send error notification
            await notifier.send_notification(
                f"Error in daily scrape task: {str(e)}",
                "Scraping Error",
                "error"
            )
            
        finally:
            # Ensure the scraper is properly closed
            if 'scraper' in locals():
                await scraper.close()
    
    async def _cleanup_task(self):
        """Perform daily cleanup tasks."""
        logger.info("Running daily cleanup task")
        
        try:
            # TODO: Implement cleanup logic
            # - Remove old log files
            # - Clean up temporary files
            # - Optimize database
            # - Clean up old sessions
            
            logger.info("Daily cleanup completed")
            
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")
            
            # Send error notification
            await notifier.send_notification(
                f"Error in cleanup task: {str(e)}",
                "Cleanup Error",
                "error"
            )

# Global instance
scheduler = TaskScheduler()
