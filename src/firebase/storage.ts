'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeFirebase } from ".";

export const uploadFile = async (file: File, path: string): Promise<string> => {
    const { firestore } = initializeFirebase();
    const storage = getStorage(firestore.app);

    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
};
