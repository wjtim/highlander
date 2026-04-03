import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, setDoc, addDoc, serverTimestamp, deleteDoc, onSnapshot, where } from 'firebase/firestore';
import Filter from 'bad-words';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
    const [currentName, setCurrentName] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [duration, setDuration] = useState(0);
    const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
    const [thirtyDayLeaderboard, setThirtyDayLeaderboard] = useState([]);
    const [sevenDayLeaderboard, setSevenDayLeaderboard] = useState([]);
    const [showThirtyDay, setShowThirtyDay] = useState(false); // Toggle state for leaderboards
    const [animationClasses, setAnimationClasses] = useState({});
    const [showReplacedAnimation, setShowReplacedAnimation] = useState(false);
    const filter = new Filter();

    useEffect(() => {
        const unsubscribeCurrentName = onSnapshot(doc(db, 'currentName', 'current'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (currentName && currentName !== data.name) {
                    triggerReplacedAnimation();
                }
                setCurrentName(data.name);
                const newStartTime = data.timestamp?.toMillis() || Date.now();
                setStartTime(newStartTime);
                setDuration(0);
            }
        });

        const unsubscribeAllTimeLeaderboard = onSnapshot(
            query(collection(db, 'leaderboard'), orderBy('duration', 'desc'), limit(5)),
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                setAllTimeLeaderboard(data);
            }
        );

        const unsubscribeThirtyDayLeaderboard = onSnapshot(
            query(
                collection(db, 'leaderboard'),
                where('signedAt', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                orderBy('duration', 'desc'),
                limit(5)
            ),
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setThirtyDayLeaderboard(data);
            }
        );

        const unsubscribeSevenDayLeaderboard = onSnapshot(
            query(
                collection(db, 'leaderboard'),
                where('signedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                orderBy('duration', 'desc'),
                limit(5)
            ),
            (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSevenDayLeaderboard(data);
            }
        );

        return () => {
            unsubscribeCurrentName();
            unsubscribeAllTimeLeaderboard();
            unsubscribeThirtyDayLeaderboard();
            unsubscribeSevenDayLeaderboard();
        };
    }, [currentName]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (startTime) {
                const newDuration = (Date.now() - startTime) / 1000;
                if (newDuration >= 0) {
                    setDuration(newDuration);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();

        if (!name) {
            toast('Name cannot be blank', {
                theme: "dark",
                pauseOnHover: false
            });
            return;
        }
        if (name.length > 15) {
            toast('Name cannot exceed 15 characters', {
                theme: "dark",
                pauseOnHover: false
            });
            return;
        }
        if (filter.isProfane(name)) {
            toast('Name contains profanity', {
                theme: "dark",
                pauseOnHover: false
            });
            return;
        }

        const docRef = doc(db, 'currentName', 'current');
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const duration = (Date.now() - data.timestamp?.toMillis() || 0) / 1000;

                const q = query(collection(db, 'leaderboard'), orderBy('duration', 'desc'), limit(5));
                const querySnapshot = await getDocs(q);
                let leaderboardData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                let addedToLeaderboard = false;
                if (leaderboardData.length < 5 || duration > leaderboardData[leaderboardData.length - 1].duration) {
                    const newEntry = await addDoc(collection(db, 'leaderboard'), {
                        name: data.name,
                        duration: duration,
                        signedAt: data.timestamp
                    });

                    leaderboardData.push({ id: newEntry.id, name: data.name, duration: duration, signedAt: data.timestamp });
                    leaderboardData = leaderboardData.sort((a, b) => b.duration - a.duration).slice(0, 5);

                    for (let i = 5; i < leaderboardData.length; i++) {
                        await deleteDoc(doc(db, 'leaderboard', leaderboardData[i].id));
                    }
                    addedToLeaderboard = true;
                }
                if (!addedToLeaderboard) {
                const weeklyQ = query(
                    collection(db, 'leaderboard'),
                    where('signedAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                    orderBy('signedAt', 'desc'),
                    orderBy('duration', 'desc'),
                    limit(5)
                );
                const weeklySnapshot = await getDocs(weeklyQ);
                let weeklyLeaderboardData = weeklySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (weeklyLeaderboardData.length < 5 || duration > weeklyLeaderboardData[weeklyLeaderboardData.length - 1].duration) {
                    const newWeeklyEntry = await addDoc(collection(db, 'leaderboard'), {
                        name: data.name,
                        duration: duration,
                        signedAt: data.timestamp
                    });

                    weeklyLeaderboardData.push({ id: newWeeklyEntry.id, name: data.name, duration: duration, signedAt: data.timestamp });
                    weeklyLeaderboardData = weeklyLeaderboardData.sort((a, b) => b.duration - a.duration).slice(0, 5);

                    for (let i = 5; i < weeklyLeaderboardData.length; i++) {
                        await deleteDoc(doc(db, 'leaderboard', weeklyLeaderboardData[i].id));
                    }
                }
            }
        }

            await setDoc(docRef, {
                name: name,
                timestamp: serverTimestamp()
            });

            const newTimestamp = Date.now();
            setCurrentName(name);
            setStartTime(newTimestamp);
            setDuration(0);
        } catch (error) {
            console.error("Error submitting name:", error);
        }
    };

    const triggerReplacedAnimation = () => {
        setShowReplacedAnimation(true);
        setTimeout(() => {
            setShowReplacedAnimation(false);
        }, 2000);
    };

    const formatDuration = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            month: 'short',  // Short month name (e.g., "Aug")
            day: 'numeric',  // Day of the month (e.g., "8")
        });
    };

    return (
        <div className='center'>
            <h1 style={{color: 'white'}}>Current Reign: </h1>
            <h2>{currentName}</h2>
            <h2 style={{color: 'white'}}>{formatDuration(duration)}</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Enter your name" maxLength="15" autoComplete='off' />
                <button type="submit">Take the Hill</button>
            </form>

            <h2 style={{color: 'white'}}>All-Time Reigns</h2>
            <ul style={{ listStyleType: "none" }}>
                {allTimeLeaderboard.map((entry, index) => (
                    <li key={entry.id} className={animationClasses[entry.id]}>
                        {entry.name} <span style={{color: 'white'}}> {formatDuration(entry.duration)}</span> {formatTimestamp(entry.signedAt)}
                    </li>
                ))}
            </ul>

            <div>
                <button onClick={() => setShowThirtyDay(!showThirtyDay)}>30 Day / 7 Day</button>
            </div>

            {showThirtyDay && (<div>
            <h2 style={{color: 'white'}}>Recent Reigns (30 Day) </h2>
            <ul style={{ listStyleType: "none" }}>
                {thirtyDayLeaderboard.map((entry, index) => (
                    <li key={entry.id} className={animationClasses[entry.id]}>
                        {entry.name} <span style={{ color: 'white' }}>{formatDuration(entry.duration)}</span> {formatTimestamp(entry.signedAt)}
                    </li>
                ))}
            </ul>
            </div>)}
            {!showThirtyDay &&(<div>
            <h2 style={{color: 'white'}}>Recent Reigns (7 Day) </h2>
            <ul style={{ listStyleType: "none" }}>
                {sevenDayLeaderboard.map((entry, index) => (
                    <li key={entry.id} className={animationClasses[entry.id]}>
                        {entry.name} <span style={{ color: 'white' }}>{formatDuration(entry.duration)}</span> {formatTimestamp(entry.signedAt)}
                    </li>
                ))}
            </ul>
            </div>)}
            {showReplacedAnimation && (
                <div className="replaced-animation">
                    <span className="replaced-text">Replaced</span>
                </div>
            )}
            <ToastContainer />
        </div>
    );
}

export default App;
