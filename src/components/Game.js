import React, { useState, useEffect, useCallback } from 'react'
import { useSpring, animated } from 'react-spring'
import parrotImage from './parrot.png' // 이미지 파일 경로 설정

const GAME_HEIGHT = 600
const GAME_WIDTH = 400
const GRAVITY = 0.6
const JUMP_FORCE = -15
const PLATFORM_HEIGHT = 15
const PLATFORM_WIDTH = 60
const PARROT_SIZE = 30

// 플랫폼 간격
const PLATFORM_GAP = GAME_HEIGHT / 6

// 앵무새의 고정된 Y 위치 (더 많이 올림)
const PARROT_POSITION_Y = GAME_HEIGHT - 2 * PLATFORM_GAP - PARROT_SIZE

// 플랫폼 이동 속도
const PLATFORM_SPEED = 2

const Game = () => {
    const [gameState, setGameState] = useState({
        parrotVelocity: 0,
        platformOffset: 0,
        platforms: [],
        canJump: true,
        gameOver: false,
        score: 0
    })

    const [rotation, setRotation] = useState(0)
    const [parrotX, setParrotX] = useState(GAME_WIDTH / 2 - PARROT_SIZE / 2) // 앵무새의 X 위치

    // 플랫폼 초기화
    const initializePlatforms = () => {
        let initialPlatforms = Array(5)
            .fill()
            .map((_, i) => ({
                x: (GAME_WIDTH - PLATFORM_WIDTH) / 2,
                y: GAME_HEIGHT - (i + 1) * PLATFORM_GAP, // 플랫폼을 아래에서 위로 배치
                direction: Math.random() > 0.5 ? 1 : -1 // 초기 방향 랜덤 설정
            }))

        // 서로 붙어있는 플랫폼의 x 좌표가 겹치지 않도록 조정
        initialPlatforms = initialPlatforms.map((platform, index) => {
            if (index > 0) {
                let prevPlatform = initialPlatforms[index - 1]
                while (Math.abs(platform.x - prevPlatform.x) < PLATFORM_WIDTH) {
                    platform.x = Math.random() * (GAME_WIDTH - PLATFORM_WIDTH)
                }
            }
            return platform
        })

        return initialPlatforms
    }

    useEffect(() => {
        setGameState(prev => ({ ...prev, platforms: initializePlatforms() }))
    }, [])

    // 게임 루프
    useEffect(() => {
        if (gameState.gameOver) return

        const gameLoop = setInterval(() => {
            setGameState(prev => {
                const newVelocity = prev.parrotVelocity + GRAVITY
                let newOffset = prev.platformOffset - newVelocity
                let canJump = false

                // 충돌 감지
                const onPlatform = prev.platforms.find(platform => {
                    const parrotBottom = PARROT_POSITION_Y + PARROT_SIZE
                    const platformTop = platform.y + newOffset
                    const platformBottom = platformTop + PLATFORM_HEIGHT
                    const parrotLeft = parrotX
                    const parrotRight = parrotX + PARROT_SIZE
                    const platformLeft = platform.x
                    const platformRight = platform.x + PLATFORM_WIDTH

                    const isOnPlatform =
                        parrotBottom >= platformTop &&
                        parrotBottom <= platformBottom &&
                        parrotLeft < platformRight &&
                        parrotRight > platformLeft

                    // 앵무새가 내려오거나 정지 상태인지 확인 (속도가 0이거나 양수인 경우)
                    if (isOnPlatform && prev.parrotVelocity >= 0) {
                        setParrotX(
                            platform.x + PLATFORM_WIDTH / 2 - PARROT_SIZE / 2
                        ) // 앵무새의 x 위치를 플랫폼의 x 위치로 설정
                        return true
                    }
                    return false
                })

                if (onPlatform) {
                    newOffset = prev.platformOffset
                    canJump = true
                }

                // 게임 오버 조건
                if (newOffset < -GAME_HEIGHT) {
                    return { ...prev, gameOver: true }
                }

                // 새로운 플랫폼 생성 로직
                let updatedPlatforms = [...prev.platforms]

                // 화면 아래로 사라진 플랫폼 제거
                const filteredPlatforms = updatedPlatforms.filter(
                    platform => platform.y + newOffset < GAME_HEIGHT
                )

                // 만약 플랫폼이 사라졌다면, 새로운 플랫폼을 맨 위에 추가
                if (filteredPlatforms.length < updatedPlatforms.length) {
                    const highestPlatformY = Math.min(
                        ...updatedPlatforms.map(p => p.y)
                    )
                    filteredPlatforms.push({
                        x: (GAME_WIDTH - PLATFORM_WIDTH) / 2, // 가운데로 배치
                        y: highestPlatformY - PLATFORM_GAP,
                        direction: Math.random() > 0.5 ? 1 : -1 // 초기 방향 랜덤 설정
                    })
                }

                return {
                    ...prev,
                    parrotVelocity: onPlatform ? 0 : newVelocity,
                    platformOffset: newOffset,
                    platforms: filteredPlatforms,
                    canJump
                }
            })
        }, 1000 / 60)

        return () => clearInterval(gameLoop)
    }, [gameState.gameOver, parrotX])

    // 플랫폼 움직임 업데이트
    useEffect(() => {
        const platformMovement = setInterval(() => {
            setGameState(prev => {
                const updatedPlatforms = prev.platforms.map(platform => {
                    let newX = platform.x + platform.direction * PLATFORM_SPEED
                    let newDirection = platform.direction

                    if (newX <= 0 || newX + PLATFORM_WIDTH >= GAME_WIDTH) {
                        newDirection = -platform.direction
                        newX = platform.x + newDirection * PLATFORM_SPEED
                    }

                    return { ...platform, x: newX, direction: newDirection }
                })

                return { ...prev, platforms: updatedPlatforms }
            })
        }, 1000 / 60)

        return () => clearInterval(platformMovement)
    }, [])

    // 점프 함수
    const jump = useCallback(() => {
        if (gameState.gameOver) return
        setGameState(prev => {
            if (prev.canJump) {
                setRotation(rotation => rotation + 360) // 360도 회전 추가
                return { ...prev, parrotVelocity: JUMP_FORCE }
            }
            return prev
        })
    }, [gameState.gameOver])

    // 게임 재시작 함수
    const restartGame = () => {
        setGameState({
            parrotVelocity: 0,
            platformOffset: 0,
            platforms: initializePlatforms(),
            canJump: true,
            gameOver: false,
            score: 0
        })
        setRotation(0)
        setParrotX(GAME_WIDTH / 2 - PARROT_SIZE / 2)
    }

    // 플랫폼 애니메이션
    const platformAnimation = useSpring({
        from: { transform: 'translateY(0px)' },
        to: { transform: `translateY(${gameState.platformOffset}px)` },
        config: { duration: 50 }
    })

    // 앵무새 회전 애니메이션
    const parrotAnimation = useSpring({
        transform: `rotate(${rotation}deg)`,
        config: { duration: 200 }
    })

    return (
        <div
            style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid black',
                backgroundColor: 'skyblue'
            }}
            onClick={jump}
        >
            <animated.div style={platformAnimation}>
                {gameState.platforms.map((platform, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            left: platform.x,
                            top: platform.y,
                            width: PLATFORM_WIDTH,
                            height: PLATFORM_HEIGHT,
                            backgroundColor: 'green'
                        }}
                    />
                ))}
            </animated.div>
            <animated.img
                src={parrotImage}
                alt="Parrot"
                style={{
                    width: PARROT_SIZE,
                    height: PARROT_SIZE,
                    position: 'absolute',
                    left: parrotX,
                    top: PARROT_POSITION_Y, // 앵무새의 고정된 위치
                    objectFit: 'cover',
                    ...parrotAnimation
                }}
            />
            {gameState.gameOver && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '10px'
                    }}
                >
                    <p>Game Over</p>
                    <button
                        onClick={restartGame}
                        style={{ padding: '10px', fontSize: '16px' }}
                    >
                        Restart
                    </button>
                </div>
            )}
        </div>
    )
}

export default Game
