"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import logo from '../../../img/logo.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, doc, onSnapshot, query, where,orderBy } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';

// Custom hook to retrieve data from a subcollection with category filter
function useFirestoreSubcollection(parentCollection, parentId, subcollectionName, category, itemId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    if (itemId) {
      // Query for a specific item based on the id
      const itemDocRef = doc(db, parentCollection, parentId, subcollectionName, itemId);
      unsubscribe = onSnapshot(
        itemDocRef,
        (doc) => {
          if (doc.exists()) {
            setData([{ id: doc.id, ...doc.data() }]);
          } else {
            setData([]); // No data if the document doesn't exist
          }
          setLoading(false);
        },
        (error) => {
          setError(error.message);
          setLoading(false);
        }
      );
    } else {
      // Default query when no itemId is present
      const parentDocRef = doc(db, parentCollection, parentId); // Reference to the parent document
      const categorysubcollectionRef = collection(parentDocRef, subcollectionName); // Reference to the subcollection
      const ordersubcollectionRef = collection(parentDocRef, subcollectionName); // Reference to the subcollection


      // Create a query to filter by category
      const categoryQuery = query(
        categorysubcollectionRef,
        where('category', '==', category) // Filter for category
      );
      const orderedQuery = query(ordersubcollectionRef, orderBy('createdAt', 'asc'));

      unsubscribe = onSnapshot(
        categoryQuery,
        orderedQuery,
        (snapshot) => {
          const fetchedData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setData(fetchedData);
          setLoading(false);
        },
        (error) => {
          setError(error.message);
          setLoading(false);
        }
      );
    }

    // Cleanup listener on unmount
    return () => unsubscribe && unsubscribe();
  }, [parentCollection, parentId, subcollectionName, category, itemId]);

  return { data, loading, error };
}

const Home = ({ params }) => {
  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginTop: '80px',
      justifyContent: 'center', // Center items horizontally
      padding: '0 10px',
    },
    card: {
      border: '1px solid #eaeaea',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      textAlign: 'center',
      position: 'relative',
      width: 'calc(50% - 12px)', // Two cards per row with gap
      maxWidth: '200px',
      boxSizing: 'border-box',
      flex: '1 1 calc(50% - 12px)', // Ensure the item takes 50% width or less
    },
    image: {
      width: '100%',
      height: '140px',
      objectFit: 'cover',
    },
    info: {
      padding: '8px',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#333',
      margin: '0 0 4px',
    },
    price: {
      fontSize: '14px',
      margin: '0 0 12px',
    },
    button: (stockStatus) => ({
      padding: '4px 8px',
      marginBottom: '8px',
      backgroundColor: stockStatus === 'Off' ? '#999' : 'orange',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      cursor: stockStatus === 'Off' ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.3s ease',
    }),
    buttonHover: (stockStatus) => ({
      backgroundColor: stockStatus === 'Off' ? '#999' : '#218838',
    }),
    newLabel: {
      position: 'absolute',
      top: '8px',
      left: '8px',
      backgroundColor: '#FF0000',
      color: 'white',
      padding: '3px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
    },
    cardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    },
  
    '@media (max-width: 768px)': {
      container: {
        justifyContent: 'center', // Center items horizontally
        gap: '8px', // Reduced gap for mobile screens
      },
      card: {
        width: 'calc(50% - 8px)', // Ensure cards are centered and take up 50% of the width
        maxWidth: '140px',
        flex: '1 1 calc(50% - 8px)', // Flex rule to ensure centering
      },
      image: {
        height: '100px',
      },
      title: {
        fontSize: '14px',
      },
      price: {
        fontSize: '12px',
      },
      button: {
        fontSize: '12px',
      },
    },
  };
  
  
  
  const { dispatch } = useCart();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');

  // Use the updated hook with itemId check
  const { data: itemData, loading, error } = useFirestoreSubcollection("1", "products", "items", "Food", itemId);

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }} params={params.id} />
      <main style={{ marginTop: '70px' }}>
        <div style={styles.container}>
          {itemData.map((item) => {
            const isNew = item.createdAt && (new Date() - new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt)) <= 3600000;

            return (
              <div
                key={item.id}
                style={styles.card}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.cardHover);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, styles.card);
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={styles.image}
                  />
                )}
                <div style={styles.info}>
                  <p style={styles.title}>{item.name}</p>
                  <p style={styles.price}>{item.price} Kyats</p>
                  <button
                    onClick={() => addToCart(item)}
                    style={styles.button(item.stock)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover(item.stock))}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.button(item.stock))}
                    disabled={item.stock === 'Off'}
                  >
                    {item.stock === 'Off' ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  {isNew && <div style={styles.newLabel}>New</div>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Home;
