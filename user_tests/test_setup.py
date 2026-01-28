#!/usr/bin/env python3
"""
Quick test script to verify the user testing application setup.
Run this before starting the main application to check dependencies.
"""
import sys

def check_imports():
    """Check if all required packages are installed"""
    print("Checking dependencies...")
    errors = []
    
    try:
        import flask
        print("✓ Flask installed")
    except ImportError:
        errors.append("Flask not installed")
    
    try:
        import sentence_transformers
        print("✓ sentence-transformers installed")
    except ImportError:
        errors.append("sentence-transformers not installed")
    
    try:
        import qdrant_client
        print("✓ qdrant-client installed")
    except ImportError:
        errors.append("qdrant-client not installed")
    
    try:
        import psycopg2
        print("✓ psycopg2 installed")
    except ImportError:
        errors.append("psycopg2 not installed")
    
    try:
        import boto3
        print("✓ boto3 installed")
    except ImportError:
        errors.append("boto3 not installed")
    
    try:
        import numpy
        print("✓ numpy installed")
    except ImportError:
        errors.append("numpy not installed")
    
    return errors

def check_qdrant():
    """Check if Qdrant is running"""
    print("\nChecking Qdrant connection...")
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient("localhost", port=6333)
        collections = client.get_collections()
        print(f"✓ Qdrant is running ({len(collections.collections)} collections found)")
        return True
    except Exception as e:
        print(f"✗ Qdrant connection failed: {e}")
        return False

def check_directories():
    """Check if required directories exist"""
    print("\nChecking directory structure...")
    import os
    
    dirs = ['templates', 'results']
    errors = []
    
    for dir_name in dirs:
        if os.path.exists(dir_name):
            print(f"✓ {dir_name}/ exists")
        else:
            print(f"✗ {dir_name}/ missing")
            errors.append(f"{dir_name}/ directory not found")
    
    files = ['templates/index.html', 'templates/compare.html']
    for file_name in files:
        if os.path.exists(file_name):
            print(f"✓ {file_name} exists")
        else:
            print(f"✗ {file_name} missing")
            errors.append(f"{file_name} not found")
    
    return errors

def main():
    print("=" * 60)
    print("User Testing Application - Setup Verification")
    print("=" * 60)
    
    import_errors = check_imports()
    dir_errors = check_directories()
    qdrant_ok = check_qdrant()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if import_errors:
        print("\n⚠ Missing dependencies:")
        for error in import_errors:
            print(f"  - {error}")
        print("\nRun: pip install -r requirements.txt")
    else:
        print("✓ All dependencies installed")
    
    if dir_errors:
        print("\n⚠ Directory structure issues:")
        for error in dir_errors:
            print(f"  - {error}")
    else:
        print("✓ Directory structure OK")
    
    if not qdrant_ok:
        print("\n⚠ Qdrant is not running")
        print("  Start Qdrant before running the application")
    else:
        print("✓ Qdrant connection OK")
    
    if not import_errors and not dir_errors and qdrant_ok:
        print("\n" + "=" * 60)
        print("✓ ALL CHECKS PASSED - Ready to start!")
        print("=" * 60)
        print("\nRun the application:")
        print("  python app.py")
        print("\nOr use the start script:")
        print("  ./start.sh")
        return 0
    else:
        print("\n" + "=" * 60)
        print("✗ SOME CHECKS FAILED - Fix issues above")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
