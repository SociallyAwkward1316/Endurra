import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Signup = lazy(() => import('./pages/Signup'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const WorkoutDash = lazy(() => import('./pages/WorkoutDash'))
const WorkoutDetail = lazy(() => import('./pages/WorkoutDetail'))
const CalorieTracker = lazy(() => import('./pages/CalTracker'))
const CreateNutritionProfile = lazy(() => import('./pages/CreateNutritionProfile'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" aria-label="Loading" />}>
      <Routes>
        <Route path='/' element={<Signup />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/createNutritionProfile' element={<CreateNutritionProfile />} />
        <Route path='/workoutDash' element={<WorkoutDash />} />
        <Route path='/workoutDash/workoutDetail/:workoutId' element={<WorkoutDetail />} />

        <Route path='/calorieTracker' element={<CalorieTracker />} />
        <Route path='/analytics' element={<Analytics />} />
        <Route path='/analytics/exercise/:exerciseId' element={<Analytics />} />
        <Route path='/profile' element={<Profile />} />
      </Routes>
    </Suspense>
  )
}


export default App
