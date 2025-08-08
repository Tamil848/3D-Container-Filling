"use client";

import React, { useRef, useEffect, useMemo, useState } from 'react';
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
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const containerSize = useMemo(() => {
    return new THREE.Vector3(containerDimensions.length || 200, containerDimensions.height || 200, containerDimensions.width || 200);
  }, [containerDimensions]);

  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    const scene = sceneRef.current;
    scene.background = new THREE.Color(0xf0f5f7); // Corresponds to --background HSL

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    cameraRef.current = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
    const camera = cameraRef.current;

    controlsRef.current = new OrbitControls(camera, renderer.domElement);
    const controls = controlsRef.current;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if(currentMount) {
        currentMount.innerHTML = '';
      }
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

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
        const originalDims = [originalPackage.length, originalPackage.width, originalPackage.height];

        const orientedDims = {
          length: originalDims[config.orientation[0]],
          width: originalDims[config.orientation[1]],
          height: originalDims[config.orientation[2]],
        };

        const geometry = new THREE.BoxGeometry(orientedDims.length, orientedDims.height, orientedDims.width);
        const material = new THREE.MeshStandardMaterial({
          color: COLORS[config.packageType % COLORS.length],
          transparent: true,
          opacity: 0.9,
          roughness: 0.5,
          metalness: 0.1
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          config.position[0] + orientedDims.length / 2,
          config.position[2] + orientedDims.height / 2,
          config.position[1] + orientedDims.width / 2
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

  }, [results, containerSize, packages, isInitialized]);

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