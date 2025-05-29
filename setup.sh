set -e  # Exit on error

PYTHON=${PYTHON:-python3}

echo "Creating virtual environment..."
$PYTHON -m venv venv

ACTIVATE_SCRIPT="source venv/bin/activate"

echo "Activating virtual environment and installing package..."
eval "$ACTIVATE_SCRIPT"

pip install -e .

echo "Setup Complete"
