import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export const walletService = {
  async addCoins(userId: string, amount: number) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      coins: increment(amount)
    });
  },

  async unlockEpisode(userId: string, videoId: string, cost: number) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) throw new Error('User not found');
    
    const userData = userSnap.data();
    if (userData.coins < cost) throw new Error('Insufficient coins');
    
    await updateDoc(userRef, {
      coins: increment(-cost),
      unlockedEpisodes: [...(userData.unlockedEpisodes || []), videoId]
    });
  }
};
