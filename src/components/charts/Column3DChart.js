// client/src/components/charts/Column3DChart.js
import React, { useRef, useState } from 'react'; // REMOVED useEffect
import { Canvas, useFrame } from '@react-three/fiber'; // REMOVED useThree
import { OrbitControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Helper component for axis labels (text)
function AxisLabel({ position, text, rotation = [0, 0, 0] }) {
    return (
        <Html position={position} rotation={rotation} center>
            <div style={{
                color: 'black', // Choose a visible color
                fontSize: '14px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.7)', // Slightly transparent background for readability
                padding: '2px 6px',
                borderRadius: '3px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
                {text}
            </div>
        </Html>
    );
}

function Bar({ value, index, total, label, maxBarHeight, xOffset, color }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    // THESE CONSTANTS MUST BE DEFINED INSIDE THE BAR COMPONENT
    const BASE_GEOMETRY_HEIGHT = 1;
    const VISUAL_MAX_HEIGHT = 5;

    const targetScaleY = (value / maxBarHeight) * VISUAL_MAX_HEIGHT;

    // Position X: space bars evenly, adjusted by xOffset for centering
    const xPos = index * 2 - xOffset;

    useFrame(() => {
        if (meshRef.current) {
            // Animate scale.y towards the targetScaleY
            // Increased the interpolation factor to make the animation quicker
            meshRef.current.scale.y = THREE.MathUtils.lerp(
                meshRef.current.scale.y,
                hovered ? targetScaleY * 1.1 : targetScaleY,
                0.3 // <--- INCREASED THIS VALUE for quicker animation
            );
            // Adjust position based on the *current* scale.y to keep base at 0
            meshRef.current.position.y = (meshRef.current.scale.y * BASE_GEOMETRY_HEIGHT) / 2;
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                position={[xPos, 0, 0]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[1.5, BASE_GEOMETRY_HEIGHT, 1.5]} />
                <meshStandardMaterial color={hovered ? 'orange' : color} />
                {hovered && (
                    <Html distanceFactor={10} position={[0, targetScaleY + 0.5, 0]}>
                        <div style={{
                            background: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            color: 'black'
                        }}>
                            {label}: {value}
                        </div>
                    </Html>
                )}
            </mesh>
            <AxisLabel
                position={[xPos, -0.7, 0]}
                text={label}
                rotation={[-Math.PI / 2, 0, 0]}
            />
        </group>
    );
}

function Column3DChart({ data, xAxisLabel = "Categories", yAxisLabel = "Values" }) {
    const maxDataValue = Math.max(...data.map(item => item.value));
    // REMOVED: const maxBarHeight = maxDataValue > 0 ? maxDataValue : 1; // This line is now redundant

    const xOffset = ((data.length - 1) * 2) / 2;

    const defaultBarColors = [
        new THREE.Color(0xFF9984),
        new THREE.Color(0x36A2EB),
        new THREE.Color(0xFFCE56),
        new THREE.Color(0x4BC0C0),
        new THREE.Color(0x9966FF),
        new THREE.Color(0xFF9F40),
        new THREE.Color(0xC9CBCF),
    ];

    const getBarColor = (index) => {
        return defaultBarColors[index % defaultBarColors.length];
    };

    const sceneWidth = data.length * 2;
    const cameraZ = Math.max(sceneWidth * 0.8, 10);
    const VISUAL_MAX_HEIGHT_REF = 5;
    const cameraY = Math.max(VISUAL_MAX_HEIGHT_REF * 0.5 + 1, 5);
    const cameraX = 0;

    const gridSize = Math.max(sceneWidth + 5, 20);

    return (
        <div style={{ width: '100%', height: '500px' }}>
            <Canvas camera={{ position: [cameraX, cameraY, cameraZ], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
                <directionalLight position={[-10, -20, -10]} intensity={0.5} />

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                    <planeGeometry args={[gridSize, gridSize]} />
                    <meshStandardMaterial color="#f0f0f0" />
                </mesh>

                <Grid
                    args={[gridSize, gridSize]}
                    cellColor={"#cccccc"}
                    sectionColor={"#999999"}
                    rotation={[Math.PI / 2, 0, 0]}
                    position={[0, -0.05, 0]}
                    fadeDistance={50}
                />

                <AxisLabel
                    position={[-xOffset - 2, VISUAL_MAX_HEIGHT_REF / 2, 0]}
                    text={yAxisLabel}
                    rotation={[0, -Math.PI / 2, 0]}
                />

                {Array.from({ length: 5 }).map((_, i) => {
                    const tickValue = (i / 4) * maxDataValue;
                    const yPosition = (tickValue / maxDataValue) * VISUAL_MAX_HEIGHT_REF - 0.1;
                    return (
                        <group key={`y-tick-${i}`}>
                            <mesh position={[-xOffset - 0.5, yPosition, 0]} castShadow>
                                <boxGeometry args={[0.2, 0.05, 0.05]} />
                                <meshStandardMaterial color="gray" />
                            </mesh>
                            <AxisLabel
                                position={[-xOffset - 1.5, yPosition, 0]}
                                text={tickValue.toFixed(0)}
                            />
                        </group>
                    );
                })}

                <AxisLabel
                    position={[0, -1.5, 0]}
                    text={xAxisLabel}
                    rotation={[-Math.PI / 2, 0, 0]}
                />

                {data.map((item, idx) => (
                    isNaN(item.value) || item.value <= 0 ? null : (
                        <Bar
                            key={idx}
                            value={item.value}
                            index={idx}
                            total={data.length}
                            label={item.label}
                            // FIX: Pass the derived maxBarHeight directly
                            maxBarHeight={maxDataValue > 0 ? maxDataValue : 1}
                            xOffset={xOffset}
                            color={getBarColor(idx)}
                        />
                    )
                ))}

                <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
            </Canvas>
        </div>
    );
}

export default Column3DChart;