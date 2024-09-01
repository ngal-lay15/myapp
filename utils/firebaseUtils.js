import { db } from "../app/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function searchItems(category, searchTerm) {
  const parentDocRef = doc(db, "1", "products");
  const subcollectionRef = collection(parentDocRef, "items");

  const searchQuery = query(
    subcollectionRef,
    where('category', '==', category),
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff')
  );

  try {
    const querySnapshot = await getDocs(searchQuery);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return items;
  } catch (error) {
    console.error("Error fetching search results:", error);
    throw new Error("Error fetching search results");
  }
}
