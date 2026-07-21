# AGENTS.md

# CropCare AI Backend Agent Guide

## Objective

You are a Senior Backend Engineer, Machine Learning Engineer, FastAPI Expert, and PostgreSQL Database Architect.

Your goal is to build a complete, production-ready backend for the CropCare AI application.

The frontend already exists separately (React Native).

The backend must expose REST APIs that the frontend can consume.

Never generate incomplete code if a complete implementation is possible.

Always follow clean architecture.

Never place all logic inside `main.py`.

---

# Tech Stack

Backend

* FastAPI

Machine Learning

* PyTorch
* torchvision
* ResNet18
* Transfer Learning

Database

* PostgreSQL

ORM

* SQLAlchemy

Validation

* Pydantic

Image Processing

* Pillow

Server

* Uvicorn

Configuration

* python-dotenv

---

# Existing Files

The trained model already exists.

```
plant_model.pth
class_names.json
```

These files are located inside

```
app/ml/
```

Do not retrain the model.

Only load the model for inference.

---

# Backend Folder Structure

```
cropcare-backend/

app/

│
├── main.py
├── config.py
├── database.py
├── schemas.py
├── dependencies.py
│
├── routers/
│      prediction.py
│      history.py
│
├── services/
│      prediction_service.py
│
├── ml/
│      model.py
│      preprocess.py
│      inference.py
│      plant_model.pth
│      class_names.json
│
├── db_models/
│      prediction.py
│
├── uploads/
│
└── utils/
       image_utils.py

requirements.txt

.env
```

---

# General Rules

Always

* Use type hints
* Use SQLAlchemy ORM
* Use Pydantic models
* Use dependency injection
* Separate routers and services
* Handle exceptions
* Return proper HTTP status codes

Never duplicate code.

Never reload the model for every request.

Load the model once during application startup.

---

# Phase 1

## Project Setup

Tasks

Create

* FastAPI application
* requirements.txt
* .env
* CORS configuration
* PostgreSQL connection
* SQLAlchemy session

Verify

```
GET /
```

returns

```
CropCare AI Backend Running
```

---

# Phase 2

## Machine Learning Model

Load

```
plant_model.pth
```

Load

```
class_names.json
```

Create

```
model.py
```

Responsibilities

* Load pretrained ResNet18
* Replace final fully connected layer
* Load weights
* Load class names
* Set model.eval()
* Detect CUDA automatically

Never load model multiple times.

---

# Phase 3

## Image Preprocessing

Create

```
preprocess.py
```

Pipeline

Image

↓

Resize

224 x 224

↓

Convert RGB

↓

Tensor

↓

Normalize

Mean

```
0.485
0.456
0.406
```

Std

```
0.229
0.224
0.225
```

↓

Unsqueeze

↓

Return Tensor

Use the exact preprocessing used during training.

---

# Phase 4

## Prediction Engine

Create

```
inference.py
```

Responsibilities

Receive image

↓

Preprocess image

↓

Run inference

↓

Softmax

↓

Confidence Score

↓

Return

Disease Name

Confidence

Prediction Time

---

# Phase 5

## Prediction API

Create router

```
prediction.py
```

Endpoint

```
POST /predict
```

Input

multipart/form-data

```
image
```

Output

```json
{
    "disease": "Tomato___Early_blight",
    "confidence": 98.91
}
```

Requirements

Validate image type.

Reject unsupported files.

Handle exceptions.

Return meaningful error messages.

---

# Phase 6

## Database

Create PostgreSQL database.

Create PredictionHistory table.

Columns

```
id

image_name

predicted_disease

confidence

prediction_time

created_at
```

Automatically save every prediction.

---

# Phase 7

## Prediction History API

Create endpoints

```
GET /history
```

Return every prediction.

```
GET /history/{id}
```

Return one prediction.

```
DELETE /history/{id}
```

Delete prediction.

---

# Phase 8

## API Documentation

Swagger must automatically document

* Request schema
* Response schema
* Error responses

Verify

```
/docs
```

works correctly.

---

# Phase 9

## Logging

Log

* Prediction
* Confidence
* Errors
* Processing time

Never expose internal stack traces to API users.

---

# Phase 10

## Error Handling

Handle

* Missing file
* Invalid image
* Corrupted image
* Empty upload
* Model loading failure
* Database connection failure

Return appropriate HTTP status codes.

---

# Phase 11

## Configuration

Use

```
.env
```

Store

Database URL

Secret Keys

Debug Mode

Never hardcode credentials.

---

# Coding Standards

Follow SOLID principles.

Use clean architecture.

Keep business logic inside `services/`.

Keep API routes inside `routers/`.

Keep machine learning code inside `ml/`.

Keep database models inside `db_models/`.

Keep helper functions inside `utils/`.

Use descriptive variable names.

Keep functions focused on a single responsibility.

---

# AI Assistant Workflow

For every phase:

1. Explain the objective.
2. Create the required files.
3. Generate complete production-ready code.
4. Explain how the code works.
5. Explain how to test it.
6. Wait for confirmation before moving to the next phase.

Do not skip phases.

Do not generate placeholder implementations.

The final result must be a scalable, modular, and production-ready FastAPI backend capable of serving the trained ResNet18 model and storing prediction history in PostgreSQL.
