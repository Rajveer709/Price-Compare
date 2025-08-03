import sys
import pkg_resources

print("Python version:", sys.version)
print("\nInstalled packages:")
for pkg in pkg_resources.working_set:
    print(f"{pkg.key}=={pkg.version}")

print("\nTrying to import fake_useragent...")
try:
    from fake_useragent import UserAgent
    print("Successfully imported fake_useragent!")
    print(f"UserAgent version: {UserAgent().version}")
except Exception as e:
    print(f"Error importing fake_useragent: {e}")
