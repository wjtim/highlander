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
                const newStartTime = data.timestamp?.toMillis() || null;
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

        return () => {
            unsubscribeCurrentName();
            unsubscribeAllTimeLeaderboard();
            unsubscribeThirtyDayLeaderboard();
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
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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
                        <strong>{entry.name}</strong>: <span style={{color: 'white'}}>{formatDuration(entry.duration)}</span> <strong>Taken On:</strong> <span style={{color: 'white'}}>{formatTimestamp(entry.signedAt)}</span>
                    </li>
                ))}
            </ul>

            <h2 style={{color: 'white'}}>Recent Reigns (30 Day) </h2>
            <ul style={{ listStyleType: "none" }}>
                {thirtyDayLeaderboard.map((entry, index) => (
                    <li key={entry.id} className={animationClasses[entry.id]}>
                        <strong>{entry.name}</strong>: <span style={{ color: 'white' }}>{formatDuration(entry.duration)}</span> <strong>Taken On:</strong> <span style={{ color: 'white' }}>{formatTimestamp(entry.signedAt)}</span>
                    </li>
                ))}
            </ul>

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
