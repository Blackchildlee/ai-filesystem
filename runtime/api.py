from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import numpy as np
import os
import mimetypes
from datetime import datetime

from ai.embed import embed_texts
from index.vector_store import FaissStore
from index.metadata_store import MetadataDB
from ai.intent import parse_intent
from runtime.executor import move_files
from config import Config

app = FastAPI(title="AI Filesystem API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORE_PATH = Path("data/faiss.index")
DB_PATH = Path("data/meta.db")

# Initialize stores - handle case where they don't exist yet
fs = None
db = None

def get_stores():
    global fs, db
    if fs is None:
        fs = FaissStore(dim=384, path=STORE_PATH)
        if STORE_PATH.exists():
            fs.load()
    if db is None:
        db = MetadataDB(DB_PATH)
    return fs, db

class IntentResponse(BaseModel):
    action: str
    query: str | None = None
    dest: str | None = None
    tags: list[str] | None = []

@app.get("/")
def root():
    return {"status": "AI Filesystem API is running 🚀"}

@app.get("/search")
def search(query: str = Query(..., description="Semantic search query"), k: int = 10):
    fs, db = get_stores()
    qv = embed_texts([query])
    results = fs.search(np.array(qv), k=k)[0]
    ids = [fid for fid, _ in results]
    rows = db.get_by_ids(ids)
    return [
        {"score": dict(results)[fid], "path": row[1], "title": row[6] or Path(row[1]).stem}
        for fid, row in zip(ids, rows)
    ]

@app.post("/intent", response_model=IntentResponse)
def intent(user_input: str):
    result = parse_intent(user_input)
    return result

@app.post("/action/move")
def action_move(query: str, dest: str, k: int = 20, threshold: float = 0.4):
    fs, db = get_stores()
    qv = embed_texts([query])
    res = fs.search(np.array(qv), k=k)[0]
    chosen = [fid for fid, score in res if score >= threshold]
    rows = db.get_by_ids(chosen)
    paths = [r[1] for r in rows]
    move_files(paths, dest)
    return {"moved": len(paths), "dest": dest, "files": paths}


class FileResponse(BaseModel):
    id: str
    path: str
    name: str
    size: int
    mimeType: str
    modifiedAt: str
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: list[str] = []
    starred: bool = False
    trashed: bool = False


def scan_directory(root_path: Path, base_path: str = "") -> list[dict]:
    """Scan a directory and return file information."""
    files = []
    
    if not root_path.exists():
        return files
    
    for item in root_path.iterdir():
        if item.name.startswith('.'):
            continue
        if item.name in Config.WATCH_IGNORE_DIRS:
            continue
            
        try:
            stat = item.stat()
            mime_type, _ = mimetypes.guess_type(str(item))
            
            if item.is_file():
                rel_path = f"{base_path}/{item.name}" if base_path else f"/{item.name}"
                files.append({
                    "id": str(hash(str(item.resolve()))),
                    "path": rel_path,
                    "name": item.name,
                    "size": stat.st_size,
                    "mimeType": mime_type or "application/octet-stream",
                    "modifiedAt": datetime.fromtimestamp(stat.st_mtime).isoformat() + "Z",
                    "title": item.stem,
                    "tags": [],
                    "starred": False,
                    "trashed": False,
                })
            elif item.is_dir():
                # Recursively scan subdirectories
                subpath = f"{base_path}/{item.name}" if base_path else f"/{item.name}"
                files.extend(scan_directory(item, subpath))
        except (PermissionError, OSError):
            continue
    
    return files


@app.get("/files")
def list_files(
    path: str = Query("/", description="Directory path to list"),
    section: str = Query("home", description="Section filter: home, recent, starred, trash")
):
    """List all files from the configured root directory."""
    root = Config.ROOT_DIR
    
    if not root.exists():
        # Create the directory if it doesn't exist
        root.mkdir(parents=True, exist_ok=True)
        return {"files": [], "message": f"Created directory: {root}. Add files to see them here."}
    
    all_files = scan_directory(root)
    
    # Apply section filters
    if section == "recent":
        # Sort by modified date and return top 20
        all_files.sort(key=lambda x: x["modifiedAt"], reverse=True)
        all_files = all_files[:20]
    elif section == "starred":
        all_files = [f for f in all_files if f.get("starred", False)]
    elif section == "trash":
        all_files = [f for f in all_files if f.get("trashed", False)]
    elif path != "/":
        # Filter by path prefix
        all_files = [f for f in all_files if f["path"].startswith(path)]
    
    return {"files": all_files, "count": len(all_files)}


@app.get("/folders")
def list_folders():
    """List all folders in the root directory."""
    root = Config.ROOT_DIR
    folders = []
    
    if not root.exists():
        return {"folders": []}
    
    for item in root.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            if item.name not in Config.WATCH_IGNORE_DIRS:
                folders.append({
                    "id": item.name,
                    "label": item.name.replace("_", " ").replace("-", " ").title(),
                    "path": f"/{item.name}"
                })
    
    return {"folders": folders}


class StarRequest(BaseModel):
    file_id: str
    starred: bool


class TrashRequest(BaseModel):
    file_id: str
    trashed: bool


@app.post("/files/star")
def star_file(req: StarRequest):
    """Star or unstar a file."""
    # In a full implementation, this would persist to the database
    return {"success": True, "file_id": req.file_id, "starred": req.starred}


@app.post("/files/trash")
def trash_file(req: TrashRequest):
    """Move a file to trash or restore it."""
    # In a full implementation, this would move the file
    return {"success": True, "file_id": req.file_id, "trashed": req.trashed}
