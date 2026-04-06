# BillBoard

## Setup

```bash setup.sh```

Visit the mobile [README](https://github.com/alewisuw/capstone/blob/main/mobile/README.md) for details on starting the application via emulator or on iOS
## Run API Backend

1. ```source venv/bin/activate```
2. ```docker pull qdrant/qdrant```
3. ```docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant```
4. ```fastapi dev app/main.py```


## Run user tests

1. ```source venv/bin/activate```
2. ```docker pull qdrant/qdrant```
3. ```docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant```
4. ```fastapi dev app/main.py```
5. ```python3 user_tests/app.py```

go to:
http://localhost:6333/dashboard

