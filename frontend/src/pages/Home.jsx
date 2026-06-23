import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <>
      <div className="dash-welcome">
        <div>
          <div className="dash-welcome-text">Welkom, {user.display_name}</div>
          <div className="dash-welcome-sub">Portfolio</div>
        </div>
      </div>
    </>
  )
}
