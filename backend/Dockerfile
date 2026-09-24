# Backend de Cherry Beauty — imagen para Railway
# Stack: Python 3.14 + FastAPI + Uvicorn + MySQL (Railway MySQL)

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Copia e instala dependencias
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copia el código del backend
COPY . /app/

# Crea carpetas necesarias
RUN mkdir -p /app/app/uploads/productos

# Expone el puerto que Railway asigna (o 8000 por defecto)
EXPOSE 8000

# Comando de arranque
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
