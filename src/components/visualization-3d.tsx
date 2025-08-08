"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OptimizePackingOutput } from '@/ai/flows/optimize-packing-configuration';
import { Card, CardContent } from './ui/card';
import { Scan } from 'lucide-react';

interface Visualization3DProps {
  results: OptimizePackingOutput | null;
  containerDimensions: { length: number; width: number; height: number };
  packages: { length: number; width: number; height: number; quantity: number }[];
}

const COLORS = [
  0x1f77b4, 0xff7f0e, 0x2ca02c, 0xd62728, 0x9467bd, 0x8c564b,
  0xe377c2, 0x7f7f7f, 0xbcbd22, 0x17becf
];

export function Visualization3D({ results, containerDimensions, packages }: Visualization3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const containerSize = useMemo(() => {
    return new THREE.Vector3(containerDimensions.length || 200, containerDimensions.height || 200, containerDimensions.width || 200);
  }, [containerDimensions]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // --- Initialize scene, camera, renderer, and controls ---
    sceneRef.current = new THREE.Scene();
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0xf0f5f7);

    cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
    const camera = cameraRef.current;

    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const renderer = rendererRef.current;
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    
    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    const controls = controlsRef.current;
    controls.enableDamping = true;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // --- Animation loop ---
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize handler ---
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      controls.dispose();
      renderer.dispose();
      if (currentMount) {
        currentMount.innerHTML = '';
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!scene || !camera || !controls) return;

    // Clear previous objects
    const objectsToRemove = scene.children.filter(child => child.userData.isPackage || child.userData.isContainer);
    objectsToRemove.forEach(child => scene.remove(child));

    // Create container wireframe
    const containerGeometry = new THREE.BoxGeometry(containerSize.x, containerSize.y, containerSize.z);
    const edges = new THREE.EdgesGeometry(containerGeometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x3380b8, linewidth: 2 }));
    line.position.set(containerSize.x / 2, containerSize.y / 2, containerSize.z / 2);
    line.userData.isContainer = true;
    scene.add(line);

    // Add packed items
    if (results) {
      results.packingConfigurations.forEach(config => {
        const originalPackage = packages[config.packageType];
        if (!originalPackage) return;
        
        const packageDims = {
            length: originalPackage.length,
            width: originalPackage.width,
            height: originalPackage.height,
        };

        const orientedDims = {
            x: packageDims[['length', 'width', 'height'][config.orientation[0]]],
            y: packageDims[['length', 'width', 'height'][config.orientation[1]]],
            z: packageDims[['length', 'width', 'height'][config.orientation[2]]],
        };

        const geometry = new THREE.BoxGeometry(orientedDims.x, orientedDims.z, orientedDims.y);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS[config.packageType % COLORS.length],
          transparent: true,
          opacity: 0.9,
          roughness: 0.5,
          metalness: 0.1
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          config.position[0] + orientedDims.x / 2,
          config.position[2] + orientedDims.z / 2,
          config.position[1] + orientedDims.y / 2
        );
        cube.userData.isPackage = true;
        scene.add(cube);
      });
    }

    // Update camera position
    const maxDim = Math.max(containerSize.x, containerSize.y, containerSize.z);
    camera.position.set(maxDim * 1.5, maxDim * 1.2, maxDim * 1.5);
    camera.lookAt(containerSize.x / 2, containerSize.y / 2, containerSize.z / 2);
    controls.target.set(containerSize.x / 2, containerSize.y / 2, containerSize.z / 2);
    controls.update();

  }, [results, containerSize, packages]);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardContent className="p-2 flex-grow relative">
        <div ref={mountRef} className="h-full w-full rounded-md" />
        {!results && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none">
            <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm">
              <Scan className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-2 text-lg font-medium">3D Visualization</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill out the form and click "Optimize" to see the result.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
