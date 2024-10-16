import * as THREE from 'three';
import { keplerianElementsType } from '@/types/planet';
import { calculateOrbitalPosition } from '@/utils/keplerianElements';
import { ObjectsType } from '@/types/general';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'
export class Orbit {
    private keplerianElements: keplerianElementsType;
    private orbitColor: string;
    private targetObject: ObjectsType;
    private instancedMesh: THREE.InstancedMesh | null = null;

    constructor(keplerianElements: keplerianElementsType, orbitColor: string, targetObject: ObjectsType) {
        this.keplerianElements = keplerianElements;
        this.orbitColor = orbitColor;
        this.targetObject = targetObject;
    }

    private getOrbitalPeriod(): number {
        const semiMajorAxis = this.keplerianElements.a;
        const orbitalPeriodInYears = Math.pow(semiMajorAxis, 1.5);
        return orbitalPeriodInYears * 365;
    }

    private calculateSegmentCount(eccentricity: number, semiMajorAxis: number): number {
        let baseSegments = 800;
        if (eccentricity > 0.3) {
            baseSegments += Math.floor(eccentricity * 5000);
        }
        if (semiMajorAxis > 5) {
            baseSegments += Math.floor(semiMajorAxis * 2000);
        }
        return Math.min(baseSegments, 10000);
    }

    drawOrbit(scene: THREE.Scene, maxOrbits: number = 1) {
        if (this.targetObject === "PLANET") {
            this.createPlanetOrbitInstanced(scene, maxOrbits);
        } else {
            this.createNeoOrbitInstanced(scene, maxOrbits);
        }
    }

    private createNeoOrbitInstanced(scene: THREE.Scene, maxOrbits: number) {
        const keplerianElements = this.keplerianElements;
        const orbitPoints: THREE.Vector3[] = [];
        const totalSegments = this.calculateSegmentCount(keplerianElements.e, keplerianElements.a);
        const orbitalPeriod = this.getOrbitalPeriod();
        let prevPosition = calculateOrbitalPosition(0, keplerianElements);

        orbitPoints.push(prevPosition);
        for (let i = 1; i <= totalSegments; i++) {
            const t = (i / totalSegments) * orbitalPeriod;
            const position = calculateOrbitalPosition(t, keplerianElements);
            const distance = position.distanceTo(prevPosition);
            if (distance > 0.1) {
                const midT = (i - 0.5) / totalSegments * orbitalPeriod;
                const midPosition = calculateOrbitalPosition(midT, keplerianElements);
                orbitPoints.push(midPosition);
            }
            orbitPoints.push(position);
            prevPosition = position;
        }

        const geometry = new MeshLineGeometry()
        geometry.setPoints(orbitPoints);
        const material = new MeshLineMaterial({
            color: new THREE.Color(this.orbitColor),
            opacity: 0.9,
            lineWidth: 1,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
        });
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxOrbits);

        const dummyMatrix = new THREE.Matrix4();
        for (let i = 0; i < maxOrbits; i++) {
            dummyMatrix.identity();
            this.instancedMesh.setMatrixAt(i, dummyMatrix);
        }
        this.instancedMesh.frustumCulled = true;
        scene.add(this.instancedMesh);
    }

    private createPlanetOrbitInstanced(scene: THREE.Scene, maxOrbits: number) {
        const orbitPoints: THREE.Vector3[] = [];
        const totalSegments = 5000;
        const orbitalPeriod = this.getOrbitalPeriod();

        for (let i = 0; i <= totalSegments; i++) {
            const t = (i / totalSegments) * orbitalPeriod;
            const position = calculateOrbitalPosition(t, this.keplerianElements);
            orbitPoints.push(position);
        }

        const geometry = new MeshLineGeometry()
        geometry.setPoints(orbitPoints);
        const material = new MeshLineMaterial({
            color: new THREE.Color(this.orbitColor), 
            lineWidth: 0.5,  
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)

        });
 
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, maxOrbits);

        const dummyMatrix = new THREE.Matrix4();
        for (let i = 0; i < maxOrbits; i++) {
            dummyMatrix.identity();
            this.instancedMesh.setMatrixAt(i, dummyMatrix);
        }

        this.instancedMesh.frustumCulled = true;
        scene.add(this.instancedMesh);
    }

    removeOrbit(scene: THREE.Scene) {
        if (this.instancedMesh) {
            scene.remove(this.instancedMesh);  
            this.instancedMesh.geometry.dispose();
            if (Array.isArray(this.instancedMesh.material)) {
                this.instancedMesh.material.forEach((material) => {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose();
                    }
                });
            } else {
                this.instancedMesh.material.dispose(); 
            }
            this.instancedMesh = null;
        }
    }
    
}