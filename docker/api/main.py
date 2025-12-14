"""
FastAPI Main Application
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import httpx
import os
from typing import Optional

# Security
security = HTTPBearer()

# Initialize FastAPI app
app = FastAPI(
    title="Full Stack API",
    description="API Server with MCP Integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCP Gateway URL
MCP_GATEWAY_URL = os.getenv("MCP_GATEWAY_URL", "http://mcp_gateway:8000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 API Server starting...")
    yield
    # Shutdown
    print("🛑 API Server shutting down...")


app.router.lifespan_context = lifespan


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "api_server",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Full Stack API Server",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    # Check MCP gateway connectivity
    mcp_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MCP_GATEWAY_URL}/health", timeout=5.0)
            if response.status_code == 200:
                mcp_status = "connected"
            else:
                mcp_status = "error"
    except Exception as e:
        mcp_status = f"error: {str(e)}"

    return {
        "api": "operational",
        "mcp_gateway": mcp_status
    }


@app.post("/api/v1/mcp/execute")
async def execute_mcp_tool(
    tool_name: str,
    arguments: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Execute MCP tool via gateway
    Requires authentication
    """
    # TODO: Verify JWT token with Auth0
    # token = credentials.credentials
    # Verify token...

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{MCP_GATEWAY_URL}/execute",
                json={
                    "tool": tool_name,
                    "arguments": arguments
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MCP Gateway error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


