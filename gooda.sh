#!/bin/bash

# Create project directory
mkdir ooda_loop_system
cd ooda_loop_system

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  neo4j:
    image: neo4j:4.4
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=\${NEO4J_AUTH}
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs

  fastapi-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "\${FASTAPI_PORT}:8000"
    depends_on:
      - neo4j
    environment:
      - NEO4J_URI=\${NEO4J_URI}
      - NEO4J_USER=\${NEO4J_USER}
      - NEO4J_PASSWORD=\${NEO4J_PASSWORD}

volumes:
  neo4j_data:
  neo4j_logs:
EOF

# Create .env file
cat > .env << EOF
NEO4J_AUTH=neo4j/yourpassword
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=yourpassword
FASTAPI_PORT=8000
EOF

# Create Dockerfile
cat > Dockerfile << EOF
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.68.0
uvicorn==0.15.0
neo4j==4.3.6
pydantic==1.8.2
EOF

# Create main.py
cat > main.py << EOF
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from neo4j_ooda_utilities import Neo4jOODAUtilities

app = FastAPI()

# Initialize Neo4j connection using environment variables
neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
neo4j_user = os.getenv("NEO4J_USER", "neo4j")
neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
neo4j_utils = Neo4jOODAUtilities(neo4j_uri, neo4j_user, neo4j_password)

class NodeData(BaseModel):
    type: str
    properties: Dict[str, Any]

class CreateNodesRequest(BaseModel):
    nodes: List[NodeData]
    relationships: Optional[List[List[int]]] = None

class UpdateNodeStatusRequest(BaseModel):
    status: str

@app.post("/nodes", response_model=List[str])
async def create_nodes_and_relationships(request: CreateNodesRequest):
    try:
        nodes_data = [{"type": node.type, "properties": node.properties} for node in request.nodes]
        node_ids = neo4j_utils.create_nodes_and_relationships(nodes_data, request.relationships)
        return node_ids
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nodes/{node_id}")
async def get_node(node_id: str):
    node = neo4j_utils.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return node

@app.get("/nodes/{node_id}/ancestors")
async def get_node_ancestors(node_id: str, max_depth: Optional[int] = None):
    try:
        ancestors = neo4j_utils.get_ancestors([node_id], max_depth)
        return ancestors.get(node_id, [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nodes/{node_id}/descendants")
async def get_node_descendants(node_id: str, max_depth: Optional[int] = None):
    try:
        descendants = neo4j_utils.get_descendants([node_id], max_depth)
        return descendants.get(node_id, [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nodes/root")
async def get_root_nodes():
    try:
        return neo4j_utils.get_root_nodes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/nodes/{node_id}/status")
async def update_node_status(node_id: str, request: UpdateNodeStatusRequest):
    try:
        neo4j_utils.update_node_status(node_id, request.status)
        return {"message": f"Status of node {node_id} updated to {request.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
def shutdown_event():
    neo4j_utils.close()
EOF

# Create neo4j_ooda_utilities.py
cat > neo4j_ooda_utilities.py << EOF
from neo4j import GraphDatabase
from typing import List, Dict, Any, Optional, Tuple

class Neo4jOODAUtilities:
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def create_nodes_and_relationships(self, nodes_data: List[Dict[str, Any]], 
                                       relationships: Optional[List[Tuple[int, int]]] = None) -> List[str]:
        with self.driver.session() as session:
            result = session.write_transaction(
                self._create_nodes_and_relationships_tx, nodes_data, relationships
            )
            return result

    @staticmethod
    def _create_nodes_and_relationships_tx(tx, nodes_data: List[Dict[str, Any]], 
                                           relationships: Optional[List[Tuple[int, int]]]) -> List[str]:
        node_ids = []
        for node in nodes_data:
            query = (
                f"CREATE (n:{node['type']} \$properties) "
                "RETURN id(n) AS node_id"
            )
            result = tx.run(query, properties=node['properties'])
            node_ids.append(result.single()["node_id"])

        if relationships:
            for start_index, end_index in relationships:
                start_type = nodes_data[start_index]['type']
                end_type = nodes_data[end_index]['type']
                relationship_type = f"HAS_{end_type.upper()}"
                
                query = (
                    "MATCH (a), (b) "
                    "WHERE id(a) = \$start_id AND id(b) = \$end_id "
                    f"CREATE (a)-[:{relationship_type}]->(b)"
                )
                tx.run(query, start_id=node_ids[start_index], end_id=node_ids[end_index])

        return node_ids

    def get_node(self, node_id: str) -> Dict[str, Any]:
        with self.driver.session() as session:
            result = session.read_transaction(self._get_node_tx, node_id)
            return result

    @staticmethod
    def _get_node_tx(tx, node_id: str) -> Dict[str, Any]:
        query = (
            "MATCH (n) "
            "WHERE id(n) = \$node_id "
            "RETURN n"
        )
        result = tx.run(query, node_id=node_id)
        record = result.single()
        return record["n"] if record else None

    def get_ancestors(self, node_ids: List[str], max_depth: Optional[int] = None) -> Dict[str, Any]:
        with self.driver.session() as session:
            result = session.read_transaction(self._get_ancestors_tx, node_ids, max_depth)
            return result

    @staticmethod
    def _get_ancestors_tx(tx, node_ids: List[str], max_depth: Optional[int]) -> Dict[str, Any]:
        depth_clause = f"..{max_depth}" if max_depth is not None else ""
        query = (
            "MATCH (start) "
            "WHERE id(start) IN \$node_ids "
            f"MATCH path = (start)<-[:HAS_OBSERVATION|HAS_ORIENTATION|HAS_DECISION|HAS_ACTION*{depth_clause}]-(ancestor) "
            "WITH start, path, ancestor "
            "RETURN "
            "id(start) AS start_id, "
            "collect(distinct {id: id(ancestor), "
            "                  type: labels(ancestor)[0], "
            "                  properties: properties(ancestor), "
            "                  relationships: [(id(startNode(r)), type(r), id(endNode(r))) "
            "                                 | r in relationships(path)]}) AS ancestors"
        )
        result = tx.run(query, node_ids=node_ids)
        return {record["start_id"]: record["ancestors"] for record in result}

    def get_descendants(self, node_ids: List[str], max_depth: Optional[int] = None) -> Dict[str, Any]:
        with self.driver.session() as session:
            result = session.read_transaction(self._get_descendants_tx, node_ids, max_depth)
            return result

    @staticmethod
    def _get_descendants_tx(tx, node_ids: List[str], max_depth: Optional[int]) -> Dict[str, Any]:
        depth_clause = f"..{max_depth}" if max_depth is not None else ""
        query = (
            "MATCH (start) "
            "WHERE id(start) IN \$node_ids "
            f"MATCH path = (start)-[:HAS_OBSERVATION|HAS_ORIENTATION|HAS_DECISION|HAS_ACTION*{depth_clause}]->(descendant) "
            "WITH start, path, descendant "
            "RETURN "
            "id(start) AS start_id, "
            "collect(distinct {id: id(descendant), "
            "                  type: labels(descendant)[0], "
            "                  properties: properties(descendant), "
            "                  relationships: [(id(startNode(r)), type(r), id(endNode(r))) "
            "                                 | r in relationships(path)]}) AS descendants"
        )
        result = tx.run(query, node_ids=node_ids)
        return {record["start_id"]: record["descendants"] for record in result}

    def get_root_nodes(self) -> List[Dict[str, Any]]:
        with self.driver.session() as session:
            result = session.read_transaction(self._get_root_nodes_tx)
            return result

    @staticmethod
    def _get_root_nodes_tx(tx) -> List[Dict[str, Any]]:
        query = (
            "MATCH (n) "
            "WHERE NOT ()-[:HAS_OBSERVATION|HAS_ORIENTATION|HAS_DECISION|HAS_ACTION]->(n) "
            "RETURN n, labels(n) AS type"
        )
        result = tx.run(query)
        return [{"node": record["n"], "type": record["type"][0]} for record in result]

    def update_node_status(self, node_id: str, status: str):
        with self.driver.session() as session:
            session.write_transaction(self._update_node_status_tx, node_id, status)

    @staticmethod
    def _update_node_status_tx(tx, node_id: str, status: str):
        query = (
            "MATCH (n) "
            "WHERE id(n) = \$node_id "
            "SET n.status = \$status"
        )
        tx.run(query, node_id=node_id, status=status)
EOF

echo "Project setup complete. Navigate to the 'ooda_loop_system' directory to start working on your project."