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
const PLATFORM_GAP = GAME_HEIGHT / 6
const PARROT_POSITION_Y = GAME_HEIGHT - 2 * PLATFORM_GAP - PARROT_SIZE
const PLATFORM_SPEED = 2
const BACKGROUNDS = ['bg1.png', 'bg2.png', 'bg3.png', 'bg4.png']

const Game = () => {
    const [gameState, setGameState] = useState({
        parrotVelocity: 0,
        platformOffset: 0,
        platforms: [],
        canJump: true,
        gameOver: false,
        score: 0,
        highScore: 0
    })
    const [rotation, setRotation] = useState(0)
    const [parrotX, setParrotX] = useState(GAME_WIDTH / 2 - PARROT_SIZE / 2)
    const [lastPlatformY, setLastPlatformY] = useState(null)
    const [backgroundIndex, setBackgroundIndex] = useState(0)

    const initializePlatforms = () => {
        let initialPlatforms = Array(5)
            .fill()
            .map((_, i) => ({
                x: (GAME_WIDTH - PLATFORM_WIDTH) / 2,
                y: GAME_HEIGHT - (i + 1) * PLATFORM_GAP,
                direction: Math.random() > 0.5 ? 1 : -1
            }))
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

    useEffect(() => {
        if (gameState.gameOver) return

        const gameLoop = setInterval(() => {
            setGameState(prev => {
                const newVelocity = prev.parrotVelocity + GRAVITY
                let newOffset = prev.platformOffset - newVelocity
                let canJump = false

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

                    if (isOnPlatform && prev.parrotVelocity >= 0) {
                        setParrotX(
                            platform.x + PLATFORM_WIDTH / 2 - PARROT_SIZE / 2
                        )
                        return platform
                    }
                    return null
                })

                if (onPlatform) {
                    newOffset = prev.platformOffset
                    canJump = true

                    if (onPlatform.y !== lastPlatformY) {
                        setLastPlatformY(onPlatform.y)
                        const newScore = prev.score + 1

                        if (newScore % 10 === 0) {
                            setBackgroundIndex(
                                prevIndex =>
                                    (prevIndex + 1) % BACKGROUNDS.length
                            )
                        }

                        return {
                            ...prev,
                            parrotVelocity: 0,
                            platformOffset: newOffset,
                            canJump,
                            score: newScore
                        }
                    } else {
                        return {
                            ...prev,
                            parrotVelocity: 0,
                            platformOffset: newOffset,
                            canJump
                        }
                    }
                }

                if (newOffset < -GAME_HEIGHT) {
                    return {
                        ...prev,
                        gameOver: true,
                        highScore: Math.max(prev.score, prev.highScore)
                    }
                }

                let updatedPlatforms = [...prev.platforms]
                const filteredPlatforms = updatedPlatforms.filter(
                    platform => platform.y + newOffset < GAME_HEIGHT
                )

                if (filteredPlatforms.length < updatedPlatforms.length) {
                    const highestPlatformY = Math.min(
                        ...updatedPlatforms.map(p => p.y)
                    )
                    filteredPlatforms.push({
                        x: (GAME_WIDTH - PLATFORM_WIDTH) / 2,
                        y: highestPlatformY - PLATFORM_GAP,
                        direction: Math.random() > 0.5 ? 1 : -1
                    })
                }

                return {
                    ...prev,
                    parrotVelocity: newVelocity,
                    platformOffset: newOffset,
                    platforms: filteredPlatforms,
                    canJump
                }
            })
        }, 1000 / 60)

        return () => clearInterval(gameLoop)
    }, [gameState.gameOver, parrotX, lastPlatformY])

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

    const jump = useCallback(() => {
        if (gameState.gameOver) return
        setGameState(prev => {
            if (prev.canJump) {
                setRotation(rotation => rotation + 360)
                return { ...prev, parrotVelocity: JUMP_FORCE }
            }
            return prev
        })
    }, [gameState.gameOver])

    const restartGame = () => {
        setGameState({
            parrotVelocity: 0,
            platformOffset: 0,
            platforms: initializePlatforms(),
            canJump: true,
            gameOver: false,
            score: 0,
            highScore: gameState.highScore
        })
        setRotation(0)
        setParrotX(GAME_WIDTH / 2 - PARROT_SIZE / 2)
        setLastPlatformY(null)
        setBackgroundIndex(0)
    }

    const platformAnimation = useSpring({
        from: { transform: 'translateY(0px)' },
        to: { transform: `translateY(${gameState.platformOffset}px)` },
        config: { duration: 50 }
    })

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
                backgroundImage: `url(${BACKGROUNDS[backgroundIndex]})`,
                backgroundSize: 'cover'
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
                    top: PARROT_POSITION_Y,
                    objectFit: 'cover',
                    ...parrotAnimation
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    fontSize: '20px',
                    color: 'white'
                }}
            >
                Score: {gameState.score}
            </div>
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
                        borderRadius: '10px',
                        textAlign: 'center'
                    }}
                >
                    <p>Game Over</p>
                    <p>High Score: {gameState.highScore}</p>
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
