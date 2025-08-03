import os
import json
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List, Tuple
import aiofiles
import aiofiles.os

from .config import settings

logger = logging.getLogger(__name__)

class SessionManager:
    """Manages user sessions and cookies for web scraping."""
    
    def __init__(self, session_dir: str = "sessions"):
        """Initialize the session manager.
        
        Args:
            session_dir: Directory to store session files
        """
        self.session_dir = os.path.join(os.path.dirname(__file__), "..", session_dir)
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self._ensure_session_dir()
        self._cleanup_interval = 3600  # 1 hour
        self._last_cleanup = 0
    
    def _ensure_session_dir(self):
        """Ensure the session directory exists."""
        try:
            os.makedirs(self.session_dir, exist_ok=True)
        except Exception as e:
            logger.error(f"Failed to create session directory: {e}")
            raise
    
    def _get_session_file(self, session_id: str) -> str:
        """Get the path to a session file."""
        return os.path.join(self.session_dir, f"{session_id}.json")
    
    def generate_session_id(self, username: str, domain: str) -> str:
        """Generate a unique session ID for a user and domain."""
        key = f"{username}@{domain}".encode('utf-8')
        return hashlib.sha256(key).hexdigest()
    
    async def load_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Load a session from disk."""
        # Check in-memory cache first
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        session_file = self._get_session_file(session_id)
        if not os.path.exists(session_file):
            return None
            
        try:
            async with aiofiles.open(session_file, 'r', encoding='utf-8') as f:
                data = await f.read()
                session = json.loads(data)
                
                # Check if session is expired
                expires = session.get('expires')
                if expires and datetime.fromisoformat(expires) < datetime.utcnow():
                    logger.debug(f"Session {session_id} has expired")
                    await self.delete_session(session_id)
                    return None
                
                # Cache the session
                self.sessions[session_id] = session
                return session
                
        except Exception as e:
            logger.error(f"Error loading session {session_id}: {e}")
            return None
    
    async def save_session(
        self,
        session_id: str,
        cookies: List[Dict[str, Any]],
        user_agent: str,
        metadata: Optional[Dict[str, Any]] = None,
        ttl: int = 86400  # 24 hours
    ) -> bool:
        """Save a session to disk."""
        session = {
            'id': session_id,
            'cookies': cookies,
            'user_agent': user_agent,
            'created_at': datetime.utcnow().isoformat(),
            'last_used': datetime.utcnow().isoformat(),
            'expires': (datetime.utcnow() + timedelta(seconds=ttl)).isoformat(),
            'metadata': metadata or {}
        }
        
        session_file = self._get_session_file(session_id)
        
        try:
            async with aiofiles.open(session_file, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(session, indent=2))
            
            # Update cache
            self.sessions[session_id] = session
            return True
            
        except Exception as e:
            logger.error(f"Error saving session {session_id}: {e}")
            return False
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        session_file = self._get_session_file(session_id)
        
        try:
            if os.path.exists(session_file):
                await aiofiles.os.remove(session_file)
            
            # Remove from cache
            self.sessions.pop(session_id, None)
            return True
            
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False
    
    async def update_session_usage(self, session_id: str) -> bool:
        """Update the last used timestamp of a session."""
        session = await self.load_session(session_id)
        if not session:
            return False
            
        session['last_used'] = datetime.utcnow().isoformat()
        return await self.save_session(
            session_id,
            session['cookies'],
            session['user_agent'],
            session['metadata']
        )
    
    async def get_cookies_dict(self, session_id: str) -> Dict[str, str]:
        """Get cookies as a dictionary for requests."""
        session = await self.load_session(session_id)
        if not session or 'cookies' not in session:
            return {}
            
        return {cookie['name']: cookie['value'] for cookie in session['cookies']}
    
    async def cleanup_expired_sessions(self, force: bool = False) -> int:
        """Clean up expired sessions."""
        current_time = time.time()
        if not force and (current_time - self._last_cleanup) < self._cleanup_interval:
            return 0
            
        self._last_cleanup = current_time
        deleted = 0
        
        try:
            for filename in os.listdir(self.session_dir):
                if not filename.endswith('.json'):
                    continue
                    
                session_id = filename[:-5]  # Remove .json
                session = await self.load_session(session_id)
                
                if not session:  # Session is invalid or expired
                    await self.delete_session(session_id)
                    deleted += 1
                    
        except Exception as e:
            logger.error(f"Error during session cleanup: {e}")
            
        logger.info(f"Cleaned up {deleted} expired sessions")
        return deleted

# Global instance
session_manager = SessionManager()
