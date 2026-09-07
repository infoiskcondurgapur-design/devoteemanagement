import { db, storage } from './firebase';
import { collection, addDoc, updateDoc, doc, getDocs, getDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DEVOTEES_COLLECTION = 'devotees';

// --- Devotee CRUD ---

export const getAllDevotees = async () => {
    try {
        const q = query(collection(db, DEVOTEES_COLLECTION), orderBy('name'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting devotees: ", error);
        throw error;
    }
};

export const getDevoteeById = async (id) => {
    try {
        const docRef = doc(db, DEVOTEES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting devotee by ID: ", error);
        throw error;
    }
};

export const addDevotee = async (devoteeData, photoFile) => {
    try {
        let photoUrl = '';
        if (photoFile) {
            photoUrl = await uploadPhoto(photoFile);
        }

        const docRef = await addDoc(collection(db, DEVOTEES_COLLECTION), {
            ...devoteeData,
            profilePhoto: photoUrl,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding devotee: ", error);
        throw error;
    }
};

export const updateDevotee = async (id, devoteeData, photoFile) => {
    try {
        let updateData = { ...devoteeData };
        if (photoFile) {
            const photoUrl = await uploadPhoto(photoFile);
            updateData.profilePhoto = photoUrl;
        }

        const docRef = doc(db, DEVOTEES_COLLECTION, id);
        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error("Error updating devotee: ", error);
        throw error;
    }
};

// --- Storage Helper ---

export const uploadPhoto = async (file) => {
    if (!file) return null;
    try {
        const storageRef = ref(storage, `devotee-photos/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading photo: ", error);
        throw error;
    }
}
