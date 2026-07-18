#!/bin/bash

# ============================================
# MESS MANAGEMENT SYSTEM - STARTUP SCRIPT
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🍽️  MESS MANAGEMENT SYSTEM  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# FUNCTION: Check Docker
# ============================================
check_docker() {
    echo -e "${YELLOW}🔍 Checking Docker status...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running.${NC}"
        echo -e "${YELLOW}Attempting to start Docker...${NC}"
        sudo systemctl start docker
        sleep 3
        if ! docker info > /dev/null 2>&1; then
            echo -e "${RED}❌ Failed to start Docker. Please check Docker installation.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# ============================================
# FUNCTION: Load Environment Variables
# ============================================
load_env() {
    echo -e "${YELLOW}📝 Loading environment variables...${NC}"
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found!${NC}"
        echo -e "${YELLOW}Please create .env file from .env.example${NC}"
        exit 1
    fi
    set -a
    source .env
    set +a
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
}

# ============================================
# FUNCTION: Build and Start Containers
# ============================================
start_containers() {
    echo -e "${YELLOW}📦 Building and starting containers...${NC}"
    docker-compose up --build -d
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start containers!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Containers started successfully${NC}"
}

# ============================================
# FUNCTION: Wait for Services
# ============================================
wait_for_services() {
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for MongoDB
    echo -n "Waiting for MongoDB"
    for i in {1..30}; do
        if docker exec mess_mongodb mongosh \
            --username ${MONGO_INITDB_ROOT_USERNAME:-admin} \
            --password ${MONGO_INITDB_ROOT_PASSWORD:-password123} \
            --authenticationDatabase admin \
            --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            break
        fi
        echo -n "."
        sleep 2
        if [ $i -eq 30 ]; then
            echo -e " ${RED}❌${NC}"
            echo -e "${RED}MongoDB failed to start!${NC}"
        fi
    done
    
    # Wait for Backend
    echo -n "Waiting for Backend"
    for i in {1..30}; do
        if curl -s http://localhost:${NGINX_PORT:-8081}/api/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✅${NC}"
            break
        fi
        echo -n "."
        sleep 2
        if [ $i -eq 30 ]; then
            echo -e " ${RED}❌${NC}"
            echo -e "${RED}Backend failed to start!${NC}"
        fi
    done
}

# ============================================
# FUNCTION: Check Services Health
# ============================================
check_health() {
    echo -e "${YELLOW}🔍 Checking service health...${NC}"
    
    # Check MongoDB
    echo -n "  MongoDB: "
    if docker exec mess_mongodb mongosh \
        --username ${MONGO_INITDB_ROOT_USERNAME:-admin} \
        --password ${MONGO_INITDB_ROOT_PASSWORD:-password123} \
        --authenticationDatabase admin \
        --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi
    
    # Check Backend
    echo -n "  Backend:  "
    if curl -s http://localhost:${NGINX_PORT:-8081}/api/health | grep -q "healthy"; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
    
    # Check Frontend
    echo -n "  Frontend: "
    if curl -s http://localhost:${NGINX_PORT:-8081} | grep -q "Mess Manager"; then
        echo -e "${GREEN}✅ Accessible${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
    
    # Check Nginx
    echo -n "  Nginx:    "
    if curl -s http://localhost:${NGINX_PORT:-8081}/nginx-health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
}

# ============================================
# FUNCTION: Show Container Status
# ============================================
show_status() {
    echo ""
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker-compose ps
}

# ============================================
# FUNCTION: Show Access Information
# ============================================
show_access_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   🎉 SUCCESS! Application is running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📱 Access the application:${NC}"
    echo -e "   ${YELLOW}http://localhost:${NGINX_PORT:-8081}${NC}"
    echo ""
    echo -e "${BLUE}🔧 API Endpoint:${NC}"
    echo -e "   ${YELLOW}http://localhost:${NGINX_PORT:-8081}/api${NC}"
    echo -e "   ${YELLOW}http://localhost:${NGINX_PORT:-8081}/api/health${NC}"
    echo ""
    echo -e "${BLUE}📝 Useful Commands:${NC}"
    echo -e "   View all logs:     ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   View backend logs: ${YELLOW}docker-compose logs -f backend${NC}"
    echo -e "   Stop all:          ${YELLOW}docker-compose down${NC}"
    echo -e "   Restart:           ${YELLOW}docker-compose restart${NC}"
    echo -e "   Create admin:      ${YELLOW}docker exec -it mess_backend flask create-admin${NC}"
    echo -e "   Access MongoDB:    ${YELLOW}docker exec -it mess_mongodb mongosh --username admin --password password123 --authenticationDatabase admin${NC}"
    echo ""
    echo -e "${BLUE}🔐 Default Login Credentials:${NC}"
    echo -e "   Email:    ${YELLOW}admin@mess.com${NC}"
    echo -e "   Password: ${YELLOW}Admin123!${NC}"
    echo -e "   (Create your own admin user using the command above)"
    echo ""
    echo -e "${GREEN}Happy Managing! 🍽️${NC}"
}

# ============================================
# FUNCTION: Show Help
# ============================================
show_help() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./start.sh          - Start the application"
    echo "  ./start.sh help     - Show this help message"
    echo "  ./start.sh status   - Show container status"
    echo "  ./start.sh logs     - Show logs"
    echo "  ./start.sh stop     - Stop the application"
    echo "  ./start.sh restart  - Restart the application"
    echo "  ./start.sh clean    - Clean everything (remove volumes)"
}

# ============================================
# MAIN SCRIPT EXECUTION
# ============================================

# Check for command line arguments
case "$1" in
    help|--help|-h)
        show_help
        exit 0
        ;;
    status)
        show_status
        exit 0
        ;;
    logs)
        docker-compose logs -f
        exit 0
        ;;
    stop)
        echo -e "${YELLOW}🛑 Stopping containers...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Containers stopped${NC}"
        exit 0
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting containers...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Containers restarted${NC}"
        exit 0
        ;;
    clean)
        echo -e "${RED}⚠️  WARNING: This will remove all data!${NC}"
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            echo -e "${YELLOW}🧹 Cleaning everything...${NC}"
            docker-compose down -v
            docker system prune -a
            echo -e "${GREEN}✅ Clean complete${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        exit 0
        ;;
esac

# Start the application
check_docker
load_env
start_containers
wait_for_services
check_health
show_status
show_access_info