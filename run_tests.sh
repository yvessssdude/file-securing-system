#!/bin/bash
set -e

echo "=> Setting up test environment..."
python3 -m venv .venv-test
source .venv-test/bin/activate

echo "=> Installing testing dependencies..."
pip install -r requirements-test.txt

# The test suite looks for TEST_BASE_URL to override the endpoint URL if needed.
# If not set, it defaults to http://localhost:8000
if [ -z "$TEST_BASE_URL" ]; then
    echo "=> Notice: TEST_BASE_URL is not set. Defaulting to http://localhost:8000."
    echo "=> To test against a different endpoint, run: TEST_BASE_URL=http://your-server-ip:8000 ./run_tests.sh"
else
    echo "=> Running tests against: $TEST_BASE_URL"
fi

echo "=> Executing security test suite..."
pytest tests/test_security.py -v --tb=short

echo "=> Tests completed!"
