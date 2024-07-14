import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSpring, animated } from 'react-spring'
import parrotImg from '../images/parrot.png'
import bg1 from '../images/bg1.png'
import bg2 from '../images/bg2.png'
import bg3 from '../images/bg3.png'
import bg4 from '../images/bg4.png'
import bg5 from '../images/bg5.png'
import bg6 from '../images/bg6.png'
import bgMusic from '../sounds/bg_music.mp3'
import jumpSound from '../sounds/jump.mp3'
import gameOverSound from '../sounds/game_over.mp3'

const GAME_HEIGHT = 600
const GAME_WIDTH = 400
const PARROT_SIZE = 40
const PLATFORM_HEIGHT = 10
const PLATFORM_WIDTH = 60
const JUMP_FORCE = 45
const GRAVITY = 6
const SCROLL_SPEED = 2
const PLATFORM_MOVE_SPEED = 2.5

const backgrounds = [bg1, bg2, bg3, bg4, bg5, bg6]

const ParrotPlatformerGame = () => {
    const [parrotX, setParrotX] = useState(GAME_WIDTH / 2 - PARROT_SIZE / 2)
    const [platforms, setPlatforms] = useState([])
    const [gameStarted, setGameStarted] = useState(false)
    const [isJumping, setIsJumping] = useState(false)
    const [jumpVelocity, setJumpVelocity] = useState(0)
    const [score, setScore] = useState(0)
    const [isGrounded, setIsGrounded] = useState(false)
    const [currentBackground, setCurrentBackground] = useState(0)
    const [isRotating, setIsRotating] = useState(false)
    const [gameOver, setGameOver] = useState(false)

    const bgMusicRef = useRef(null)
    const jumpSoundRef = useRef(null)
    const gameOverSoundRef = useRef(null)

    useEffect(() => {
        bgMusicRef.current = new Audio(bgMusic)
        bgMusicRef.current.volume = 0.5
        jumpSoundRef.current = new Audio(jumpSound)
        gameOverSoundRef.current = new Audio(gameOverSound)
        bgMusicRef.current.loop = true

        bgMusicRef.current.addEventListener('canplaythrough', () => {
            console.log('Background music loaded')
        })
        jumpSoundRef.current.addEventListener('canplaythrough', () => {
            console.log('Jump sound loaded')
        })
        gameOverSoundRef.current.addEventListener('canplaythrough', () => {
            console.log('Game over sound loaded')
        })

        return () => {
            bgMusicRef.current.pause()
            bgMusicRef.current.currentTime = 0
        }
    }, [])

    const generatePlatform = useCallback(
        (yPosition, isInitial = false) => ({
            x: isInitial
                ? GAME_WIDTH / 2 - PLATFORM_WIDTH / 2
                : Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
            y: yPosition,
            direction: Math.random() < 0.5 ? -1 : 1
        }),
        []
    )

    const generateInitialPlatforms = useCallback(() => {
        const newPlatforms = []
        for (let i = 0; i < 5; i++) {
            newPlatforms.push(generatePlatform(i * (GAME_HEIGHT / 5), true))
        }
        setPlatforms(newPlatforms)
    }, [generatePlatform])

    const startGame = () => {
        setGameStarted(true)
        setGameOver(false)
        generateInitialPlatforms()
        setScore(0)
        setIsGrounded(false)
        setIsJumping(false)
        setJumpVelocity(0)
        setParrotX(GAME_WIDTH / 2 - PARROT_SIZE / 2)
        setCurrentBackground(0)
        bgMusicRef.current.play()
    }

    const jump = () => {
        if (isGrounded) {
            setIsJumping(true)
            setIsGrounded(false)
            setJumpVelocity(JUMP_FORCE)
            jumpSoundRef.current.play()
            setIsRotating(true)
            setTimeout(() => setIsRotating(false), 300) // 0.3초 후 회전 종료
        }
    }

    const checkCollision = useCallback(() => {
        const parrotBottom = GAME_HEIGHT / 2 + PARROT_SIZE / 2
        for (let platform of platforms) {
            if (
                parrotBottom >= platform.y &&
                parrotBottom <= platform.y + PLATFORM_HEIGHT &&
                parrotX + PARROT_SIZE > platform.x &&
                parrotX < platform.x + PLATFORM_WIDTH
            ) {
                return platform
            }
        }
        return null
    }, [parrotX, platforms])

    const endGame = () => {
        setGameStarted(false)
        setGameOver(true)
        bgMusicRef.current.pause()
        bgMusicRef.current.currentTime = 0
        gameOverSoundRef.current.play()
    }

    useEffect(() => {
        if (!gameStarted) return

        const gameLoop = setInterval(() => {
            const collidedPlatform = checkCollision()

            setPlatforms(prevPlatforms => {
                let newPlatforms = prevPlatforms.map(platform => {
                    let newX =
                        platform.x + platform.direction * PLATFORM_MOVE_SPEED
                    if (newX <= 0 || newX + PLATFORM_WIDTH >= GAME_WIDTH) {
                        platform.direction *= -1
                        newX =
                            platform.x +
                            platform.direction * PLATFORM_MOVE_SPEED
                    }
                    return {
                        ...platform,
                        x: newX,
                        y:
                            platform.y +
                            (collidedPlatform && !isJumping
                                ? 0
                                : isJumping
                                ? jumpVelocity
                                : -GRAVITY)
                    }
                })

                newPlatforms = newPlatforms.filter(
                    platform => platform.y < GAME_HEIGHT
                )
                while (newPlatforms.length < 5) {
                    newPlatforms.push(generatePlatform(0 - PLATFORM_HEIGHT))
                    setScore(prevScore => {
                        const newScore = prevScore + 1
                        if (newScore % 10 === 0) {
                            setCurrentBackground(
                                prev => (prev + 1) % backgrounds.length
                            )
                        }
                        return newScore
                    })
                }

                if (newPlatforms.every(platform => platform.y < 0)) {
                    clearInterval(gameLoop)
                    endGame()
                }

                return newPlatforms
            })

            if (collidedPlatform && !isJumping) {
                setIsGrounded(true)
                setJumpVelocity(0)
                setParrotX(
                    collidedPlatform.x + PLATFORM_WIDTH / 2 - PARROT_SIZE / 2
                )
            } else {
                setIsGrounded(false)
            }

            if (isJumping) {
                setJumpVelocity(prevVelocity => {
                    const newVelocity = prevVelocity - GRAVITY
                    if (newVelocity <= 0) {
                        setIsJumping(false)
                        return 0
                    }
                    return newVelocity
                })
            }
        }, 1000 / 60)

        return () => clearInterval(gameLoop)
    }, [
        gameStarted,
        isJumping,
        jumpVelocity,
        generatePlatform,
        checkCollision,
        isGrounded,
        platforms
    ])

    useEffect(() => {
        const handleKeyPress = event => {
            if (event.code === 'Space') {
                if (!gameStarted) {
                    startGame()
                } else {
                    jump()
                }
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [gameStarted, isGrounded])

    const parrotSpring = useSpring({
        from: {
            transform: `translateX(${parrotX}px) rotate(0deg)`
        },
        to: {
            transform: `translateX(${parrotX}px) rotate(${
                isRotating ? 360 : 0
            }deg)`
        },
        config: { tension: 1000, friction: 10 }
    })

    return (
        <div
            style={{
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                backgroundImage: `url(${backgrounds[currentBackground]})`,
                backgroundSize: 'cover',
                position: 'relative',
                overflow: 'hidden',
                margin: '0 auto'
            }}
            onClick={gameStarted ? jump : startGame}
        >
            {platforms.map((platform, index) => (
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
            <animated.div
                style={{
                    width: PARROT_SIZE,
                    height: PARROT_SIZE,
                    backgroundImage: `url(${parrotImg})`,
                    backgroundSize: 'cover',
                    position: 'absolute',
                    left: 0,
                    top: GAME_HEIGHT / 2 - PARROT_SIZE / 2,
                    ...parrotSpring
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    color: 'white',
                    fontSize: '20px'
                }}
            >
                Score: {score}
            </div>
            {!gameStarted && !gameOver && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'white',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: '20px',
                        borderRadius: '10px',
                        width: '300px'
                    }}
                >
                    <h2>🦜앵무 점프 게임🦜</h2>
                    <br />
                    <p>마우스 클릭 또는 스페이스바를 누르세요</p>
                </div>
            )}
            {!gameStarted && gameOver && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'white',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: '20px',
                        borderRadius: '10px',
                        width: '300px'
                    }}
                >
                    <p>게임 오버😦</p>
                    <p>당신의 점수는 {score}점입니다!</p>
                </div>
            )}
        </div>
    )
}

export default ParrotPlatformerGame
