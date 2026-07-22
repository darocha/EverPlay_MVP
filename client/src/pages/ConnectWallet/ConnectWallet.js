import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import globalContext from './../../context/global/globalContext'
import LoadingScreen from '../../components/loading/LoadingScreen'

import socketContext from '../../context/websocket/socketContext'
import { CS_FETCH_LOBBY_INFO } from '../../game/actions'
import './ConnectWallet.scss'

const ConnectWallet = () => {
  const { setWalletAddress, setUserName } = useContext(globalContext)

  const { socket } = useContext(socketContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [formValues, setFormValues] = useState({
    walletAddress: '',
    gameId: '1',
    username: '',
  })

  const walletAddress = query.get('walletAddress')
  const gameId = query.get('gameId')
  const username = query.get('username')
  const hasRequiredParams = Boolean(walletAddress && gameId && username)

  useEffect(() => {
    setFormValues({
      walletAddress: walletAddress || '',
      gameId: gameId || '1',
      username: username || '',
    })
  }, [gameId, username, walletAddress])

  useEffect(() => {
    setHasTimedOut(false)

    if (!hasRequiredParams || (socket && socket.connected)) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setHasTimedOut(true)
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [hasRequiredParams, socket])

  useEffect(() => {
    if (socket !== null && socket.connected === true) {
      if (hasRequiredParams) {
        setWalletAddress(walletAddress)
        setUserName(username)
        socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username })
        navigate('/play')
      }
    }
  }, [gameId, hasRequiredParams, navigate, setUserName, setWalletAddress, socket, username, walletAddress])

  const handleChange = ({ target: { name, value } }) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextQuery = new URLSearchParams({
      walletAddress: formValues.walletAddress,
      gameId: formValues.gameId,
      username: formValues.username,
    })

    navigate(`/?${nextQuery.toString()}`)
  }

  if (!hasRequiredParams) {
    return (
      <div className="connect-wallet-page d-flex align-items-center justify-content-center p-4">
        <form className="connect-wallet-card" onSubmit={handleSubmit}>
          <h1 className="mb-3">Enter game details</h1>
          <p className="mb-4">This app expected an external launcher to provide these values. Use this form to continue directly.</p>
          <label className="form-label" htmlFor="walletAddress">Wallet address</label>
          <input
            id="walletAddress"
            name="walletAddress"
            className="form-control mb-3"
            value={formValues.walletAddress}
            onChange={handleChange}
            placeholder="0x123..."
            required
          />
          <label className="form-label" htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            className="form-control mb-3"
            value={formValues.username}
            onChange={handleChange}
            placeholder="Player name"
            required
          />
          <label className="form-label" htmlFor="gameId">Game ID</label>
          <input
            id="gameId"
            name="gameId"
            className="form-control mb-4"
            value={formValues.gameId}
            onChange={handleChange}
            placeholder="1"
            required
          />
          <button className="btn btn-primary w-100" type="submit">Continue</button>
        </form>
      </div>
    )
  }

  if (hasTimedOut) {
    return (
      <div className="connect-wallet-page d-flex flex-column align-items-center justify-content-center text-center p-4">
        <h1 className="mb-3">Unable to connect to the game server</h1>
        <p className="mb-0">Check that the backend is running on port 7777 and refresh this page.</p>
      </div>
    )
  }

  return (
    <>
      <LoadingScreen />
    </>
  )
}

export default ConnectWallet
