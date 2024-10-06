import { DISTANCE_SCALE_FACTOR, ORBIT_SEGMENTS, PLANET_SIZE_SCALE_FACTOR } from '@/utils/scaling';
import * as THREE from 'three';

 
 

export class Planet {
    mesh: THREE.Mesh;
    currentTime: number = 0;
    keplerianElements: {
        a: number; // semi-major axis
        e: number; // eccentricity
        I: number; // inclination
        L: number; // mean longitude
        longPeri: number; // longitude of perihelion
        longNode: number; // longitude of ascending node
    };
    orbitLine: THREE.Line; // To store the orbit line

    constructor(scene: THREE.Scene, radius: number, texture_img: string, elements: any) {
        this.keplerianElements = elements;

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(texture_img);

        const geometry = new THREE.SphereGeometry(radius*PLANET_SIZE_SCALE_FACTOR, 32, 32);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);

       
        this.orbitLine = this.createOrbit();
        scene.add(this.orbitLine);
    }

    update(timeIncrement: number) {
        this.currentTime = timeIncrement;

        // Update the planet position
        const position = this.calculateOrbitalPosition(this.currentTime);
        this.mesh.position.copy(position);
    }
 
    calculateOrbitalPosition(time: number): THREE.Vector3 {
        const { a, e, I, longPeri, longNode } = this.keplerianElements;

        const n = Math.sqrt(1 / Math.pow(a, 3));
        const M = n * time; // Mean anomaly

        let E = M;
        const tolerance = 1e-6;
        let delta = 1;

        while (Math.abs(delta) > tolerance) {
            delta = E - e * Math.sin(E) - M;
            E -= delta / (1 - e * Math.cos(E));
        }

        const trueAnomaly = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2));

        const r = a * (1 - e * Math.cos(E));

        const x = r * Math.cos(trueAnomaly + longPeri);
        const y = r * Math.sin(trueAnomaly + longPeri);

        const z = y * Math.sin(I);
        const yInclined = y * Math.cos(I);

        const xFinal = x * Math.cos(longNode) - yInclined * Math.sin(longNode);
        const yFinal = x * Math.sin(longNode) + yInclined * Math.cos(longNode);

        return new THREE.Vector3(xFinal * DISTANCE_SCALE_FACTOR, z * DISTANCE_SCALE_FACTOR, yFinal * DISTANCE_SCALE_FACTOR);
    }

     createOrbit(  ) {
        const { a, e, I, longPeri, longNode } =  this.keplerianElements;
        const orbitPoints = [];
    
        for (let i = 0; i <= ORBIT_SEGMENTS; i++) {
            const trueAnomaly = (i / ORBIT_SEGMENTS) * 2 * Math.PI;  
            const r = a * (1 - e * Math.cos(trueAnomaly));  
    
        
            const x = r * Math.cos(trueAnomaly + longPeri);
            const y = r * Math.sin(trueAnomaly + longPeri);
            const z = y * Math.sin(I);   
            const yInclined = y * Math.cos(I);  
    
          
            const xFinal = x * Math.cos(longNode) - yInclined * Math.sin(longNode);
            const yFinal = x * Math.sin(longNode) + yInclined * Math.cos(longNode);
    
            orbitPoints.push(new THREE.Vector3(xFinal * DISTANCE_SCALE_FACTOR, z * DISTANCE_SCALE_FACTOR, yFinal * DISTANCE_SCALE_FACTOR));
        }
    
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });  
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    
        return orbitLine;
    }
}
