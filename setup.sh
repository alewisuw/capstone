set -e  # Exit on error

PYTHON=${PYTHON:-python3}

case "$OSTYPE" in
  linux*|darwin*)
    echo "hi"
    ;;
  msys*|cygwin*|win32)
    echo "bye"
    ;;
  *)
    echo "Unsupported OS: $OSTYPE"
    exit 1
    ;;
esac

echo "Creating virtual environment..."
$PYTHON -m venv venv

ACTIVATE_SCRIPT=""

case "$OSTYPE" in
  linux*|darwin*)
    ACTIVATE_SCRIPT="source venv/bin/activate"
    echo "hi"
    ;;
  msys*|cygwin*|win32)
    ACTIVATE_SCRIPT="venv/Scripts/activate"
    ;;
  *)
    echo "Unsupported OS: $OSTYPE"
    exit 1
    ;;
esac

echo "Activating virtual environment and installing package..."
eval "$ACTIVATE_SCRIPT"

pip install -e .

echo "Setup Complete"
