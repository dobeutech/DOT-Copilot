"""
MCP Gateway/Orchestrator
Manages communication with MCP servers
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Dict, Any
import redis
import json

app = FastAPI(
    title="MCP Gateway",
    description="Gateway for MCP Server Orchestration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = None
try:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/1")
    redis_client = redis.from_url(redis_url, decode_responses=True)
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")

# MCP Server configurations
MCP_SERVERS = {
    "github": {
        "url": "http://github_mcp:8000",
        "enabled": bool(os.getenv("GITHUB_TOKEN"))
    },
    # Add other MCP servers here
}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mcp_gateway",
        "servers": {name: "enabled" if config["enabled"] else "disabled" 
                   for name, config in MCP_SERVERS.items()}
    }


@app.post("/execute")
async def execute_mcp_tool(request: Dict[str, Any]):
    """
    Execute a tool on an MCP server
    Request format: {
        "tool": "tool_name",
        "server": "github",  # optional, will auto-detect
        "arguments": {...}
    }
    """
    tool_name = request.get("tool")
    server_name = request.get("server")
    arguments = request.get("arguments", {})

    if not tool_name:
        raise HTTPException(status_code=400, detail="Tool name required")

    # Auto-detect server if not specified
    if not server_name:
        # Simple heuristic: check tool name prefix
        if tool_name.startswith("github_"):
            server_name = "github"
        else:
            raise HTTPException(
                status_code=400, 
                detail="Server name required or tool name must include server prefix"
            )

    if server_name not in MCP_SERVERS:
        raise HTTPException(
            status_code=404, 
            detail=f"MCP server '{server_name}' not found"
        )

    server_config = MCP_SERVERS[server_name]
    if not server_config["enabled"]:
        raise HTTPException(
            status_code=503,
            detail=f"MCP server '{server_name}' is not enabled"
        )

    # Cache key for rate limiting
    cache_key = f"mcp:execute:{server_name}:{tool_name}"
    
    # Check cache
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

    # Execute tool (placeholder - actual MCP protocol implementation needed)
    try:
        # TODO: Implement actual MCP protocol communication
        # For now, return mock response
        result = {
            "success": True,
            "server": server_name,
            "tool": tool_name,
            "result": f"Executed {tool_name} on {server_name}",
            "arguments": arguments
        }

        # Cache result (5 minutes)
        if redis_client:
            redis_client.setex(cache_key, 300, json.dumps(result))

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing tool: {str(e)}"
        )


@app.get("/servers")
async def list_servers():
    """List available MCP servers"""
    return {
        "servers": {
            name: {
                "enabled": config["enabled"],
                "url": config["url"]
            }
            for name, config in MCP_SERVERS.items()
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


