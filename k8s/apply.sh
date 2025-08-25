#!/bin/bash

# Paradise Bakes & Cafe - Kubernetes Deployment Script
# This script deploys the complete application stack to Kubernetes

set -e

echo "🚀 Starting Paradise Bakes & Cafe Kubernetes Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if we have a valid kubeconfig
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Connected to Kubernetes cluster: $(kubectl config current-context)"

# Create namespace and RBAC
print_status "Creating namespace and RBAC..."
kubectl apply -f k8s/namespace.yaml
print_success "Namespace and RBAC created"

# Wait for namespace to be ready
kubectl wait --for=condition=Active namespace/paradise-bakes-cafe --timeout=60s

# Deploy MongoDB
print_status "Deploying MongoDB..."
kubectl apply -f k8s/mongodb.yaml
print_success "MongoDB manifests applied"

# Wait for MongoDB to be ready
print_status "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=paradise-mongodb -n paradise-bakes-cafe --timeout=300s
print_success "MongoDB is ready"

# Deploy the main application
print_status "Deploying Paradise Bakes & Cafe application..."
kubectl apply -f k8s/deployment.yaml
print_success "Application manifests applied"

# Wait for application to be ready
print_status "Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=paradise-bakes-cafe -n paradise-bakes-cafe --timeout=300s
print_success "Application is ready"

# Deploy monitoring stack
print_status "Deploying monitoring stack (Prometheus & Grafana)..."
kubectl apply -f k8s/monitoring.yaml
print_success "Monitoring stack deployed"

# Wait for monitoring to be ready
print_status "Waiting for monitoring stack to be ready..."
kubectl wait --for=condition=ready pod -l app=prometheus -n paradise-bakes-cafe --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n paradise-bakes-cafe --timeout=300s
print_success "Monitoring stack is ready"

# Get service information
print_status "Getting service information..."
echo ""
echo "=== Service Endpoints ==="
echo "Application:"
kubectl get svc paradise-service -n paradise-bakes-cafe
echo ""
echo "MongoDB:"
kubectl get svc paradise-mongodb-service -n paradise-bakes-cafe
echo ""
echo "Prometheus:"
kubectl get svc prometheus-service -n paradise-bakes-cafe
echo ""
echo "Grafana:"
kubectl get svc grafana-service -n paradise-bakes-cafe

# Get pod status
print_status "Pod Status:"
kubectl get pods -n paradise-bakes-cafe

# Get ingress information
print_status "Ingress Status:"
kubectl get ingress -n paradise-bakes-cafe

# Check if ingress controller is available
if kubectl get pods -n ingress-nginx &> /dev/null; then
    print_success "NGINX Ingress Controller is running"
else
    print_warning "NGINX Ingress Controller not found. You may need to install it:"
    echo "kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml"
fi

# Check if cert-manager is available
if kubectl get pods -n cert-manager &> /dev/null; then
    print_success "Cert-Manager is running"
else
    print_warning "Cert-Manager not found. You may need to install it for SSL certificates:"
    echo "kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml"
fi

# Display useful commands
echo ""
echo "=== Useful Commands ==="
echo "View application logs:"
echo "  kubectl logs -f deployment/paradise-bakes-cafe -n paradise-bakes-cafe"
echo ""
echo "View MongoDB logs:"
echo "  kubectl logs -f statefulset/paradise-mongodb -n paradise-bakes-cafe"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward svc/prometheus-service 9090:9090 -n paradise-bakes-cafe"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward svc/grafana-service 3000:3000 -n paradise-bakes-cafe"
echo "  Username: admin, Password: paradise123"
echo ""
echo "Scale application:"
echo "  kubectl scale deployment paradise-bakes-cafe --replicas=3 -n paradise-bakes-cafe"
echo ""
echo "Delete everything:"
echo "  kubectl delete namespace paradise-bakes-cafe"

print_success "🎉 Paradise Bakes & Cafe deployment completed successfully!"
print_status "The application should be accessible via your ingress controller once DNS is configured."
