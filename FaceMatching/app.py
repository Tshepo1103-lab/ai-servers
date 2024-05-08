import os
import shutil
import uuid
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import httpx

app = FastAPI()

# Setup CORS
origins = [
    "http://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Index route
@app.get('/')
async def index():
    return {'message': 'Hello, stranger'}

# Function to list files in a directory
def list_files(directory_path):
    return [name for name in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, name))]

# Function to save an image with a unique filename
def save_image(image, directory):
    filename = str(uuid.uuid4()) + os.path.splitext(image.filename)[1]
    with open(os.path.join(directory, filename), "wb") as f:
        shutil.copyfileobj(image.file, f)
    return filename

# Store profile with image route
@app.post("/store_profile_with_image")
async def store_profile_with_image(image: UploadFile = File(...)):
    filename = save_image(image, "images")
    return {"message": "Image saved successfully", "filename": filename}


@app.post("/facematchResponse")
async def get_profiles(array_of_objects: list):
    profile_responses = []
    for obj in array_of_objects:
        profile_id = obj.get("id")
        if profile_id:
            response = await httpx.get(f"https://localhost:44311/api/services/app/Profile/GetProfileById?profileId={profile_id}")
            profile_responses.append(response.json())
    return profile_responses

# Face match route
@app.post('/facematch')
async def facematch(file: UploadFile = File(...)):
    base_files = list_files("db")
    input_image_filename = save_image(file, "db_input")
    
    similar_files = []
    for base_file in base_files:
        result = DeepFace.verify(img1_path=os.path.join("db", base_file), img2_path=os.path.join("db_input", input_image_filename), enforce_detection=False)
        if result["distance"] <= 0.5:
            similar_files.append({"id": os.path.splitext(base_file)[0]})
    
    # Delete the input image after processing
    os.remove(os.path.join("db_input", input_image_filename))
    
    return similar_files

# Run the app
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
