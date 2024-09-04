import { useState, useEffect } from 'react';
import Link from 'next/link';
import logo from '../../img/logo.png';
import cartimg from '../../img/cart.png';
import { useCart } from '../../CartContext';
import { collection, getDocs, query, where, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter } from 'next/navigation';

const Header = ({ params }) => {
  const { cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [items, setItems] = useState([]);
  const [isBillPaidEnabled, setIsBillPaidEnabled] = useState(false);
  const router = useRouter();

  // Fetch items on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsCollection = collection(db, '1/products/items');
        const itemsSnapshot = await getDocs(itemsCollection);
        const itemsList = itemsSnapshot.docs.map(doc => ({
          name: doc.data().name,
          id: doc.id,
          category: doc.data().category
        }));
        setItems(itemsList);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };

    fetchItems();
  }, []);

  // Check bill status in real-time
  useEffect(() => {
    const orderItemsCollection = collection(db, '1/order/items');
    const orderItemsQuery = query(orderItemsCollection, where('table', '==', params));

    const deliveredItemsCollection = collection(db, '1/delivered/items');
    const deliveredItemsQuery = query(deliveredItemsCollection, where('table', '==', params));

    const billingItemsCollection = collection(db, '1/billing/items');
    const billingItemsQuery = query(billingItemsCollection, where('table', '==', params));

    const unsubscribeOrder = onSnapshot(orderItemsQuery, (snapshot) => {
      const orderItemsExists = !snapshot.empty;

      const unsubscribeDelivered = onSnapshot(deliveredItemsQuery, (deliveredSnapshot) => {
        const deliveredItemsExists = !deliveredSnapshot.empty;

        const unsubscribeBilling = onSnapshot(billingItemsQuery, (billingSnapshot) => {
          const billingItemsExists = !billingSnapshot.empty;

          setIsBillPaidEnabled((deliveredItemsExists || orderItemsExists) && !billingItemsExists);
        });

        // Cleanup billing listener
        return () => unsubscribeBilling();
      });

      // Cleanup delivered listener
      return () => unsubscribeDelivered();
    });

    // Cleanup the order listener on unmount
    return () => unsubscribeOrder();
  }, [params]);

  const handleSearchChange = (e) => {
    const search = e.target.value.trim();
    setSearchTerm(search);

    if (search.length > 0) {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  const handleItemClick = (item) => {
    if (item.category === 'Food') {
      router.push(`/${params}/food?id=${item.id}`);
    } else if (item.category === 'Drink') {
      router.push(`/${params}/drink?id=${item.id}`);
    }
    setSearchTerm('');
    setFilteredItems([]);
  };

  const handlePayBill = async () => {
    if (!isBillPaidEnabled) return;

    try {
      const billingData = {
        table: params,
        accept: 0,
        createdAt: serverTimestamp(),
      };

      const billingCollection = collection(db, '1/billing/items');
      await addDoc(billingCollection, billingData);

      alert('Bill successfully paid!');
      setIsBillPaidEnabled(false);
    } catch (error) {
      console.error('Error paying bill: ', error);
    }
  };

  return (
    <header>
      <nav>
        <ul>
          <li className="left-section">
            <Link href={`/${params}/food`}>
              <img src={logo.src} width="30px" height="30px" alt="Logo" />
            </Link>
          </li>

          <li style={{fontSize:'10px'}} className="left-section">
            <Link className="nav-link" href={`/${params}/food`}>
              Food
            </Link>
          </li>

          <li style={{fontSize:'10px'}} className="left-section">
            <Link className="nav-link" href={`/${params}/drink`}>
              Drink
            </Link>
          </li>

          <li className="search-section">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {filteredItems.length > 0 && (
              <div className="dropdown">
                {filteredItems.map((item) => (
                  <li key={item.id} onClick={() => handleItemClick(item)}>
                    {item.name}
                  </li>
                ))}
              </div>
            )}
          </li>

          <li className="right-section">
            <Link href={`/${params}/cart`}>
              <div className="cart-icon">
                <span className="cart-count">{cart.length}</span>
                <img src={cartimg.src} width="30px" height="30px" alt="Cart" />
              </div>
            </Link>
          </li>

          <li className="right-section bill-paid">
            <button 
              onClick={handlePayBill} 
              disabled={!isBillPaidEnabled}
              className={isBillPaidEnabled ? 'enabled' : 'disabled'}
            >
              ဘေရှင်းရန်
            </button>
          </li>
        </ul>
      </nav>

      <style jsx>{`
        header {
          position: fixed;
          top: 0;
          width: 100%;
          background: white;
          color: #333;
          padding: 0.5rem 0.5rem;
          z-index: 1000;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        nav ul {
          display: flex;
          list-style: none;
          justify-content: space-between;
          align-items: center;
          padding: 0;
          margin: 0;
          flex-wrap: nowrap;
          overflow-x: auto;
        }
        nav ul li {
          margin-right: 0.75rem;
        }
        .nav-link {
          color: #333;
          text-decoration: none;
          font-size: 0.75rem;
        }
        .left-section {
          display: flex;
          align-items: center;
        }
        .search-section {
          flex-grow: 1;
          margin: 0 0.75rem;
        }
        .search-input {
          width: 100%;
          padding: 0.4rem;
          border: 2px solid orange;
          border-radius: 4px;
          background-color: #fff;
          color: #333;
          font-size: 0.75rem;
        }
        .dropdown {
          list-style: none;
          margin: 0;
          padding: 0.5rem;
          position: absolute;
          background-color: white;
          border: 1px solid orange;
          border-radius: 4px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .dropdown li {
          padding: 0.5rem;
          cursor: pointer;
          background-color: #fff;
          border: 1px solid orange;
          border-radius: 4px;
          text-align: center;
        }
        .dropdown li:hover {
          background-color: orange;
          color: white;
        }
        .right-section {
          display: flex;
          align-items: center;
        }
        .cart-icon {
          position: relative;
          display: inline-block;
        }
        .cart-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: orange;
          color: #333;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: bold;
        }
        .bill-paid {
          background-color: orange;
          color: #333;
          padding: 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        .bill-paid button {
          background: orange;
          border: none;
          color: #333;
          padding: 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
          cursor: pointer;
        }
        .bill-paid button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          nav ul {
            overflow-x: auto;
            justify-content: flex-start;
          }
          .search-section {
            margin: 0 0.5rem;
          }
          .search-input {
            font-size: 0.65rem;
            padding: 0.2rem;
          }
          .right-section {
            margin-left: 0;
          }
          nav ul li {
            margin-right: 0.5rem;
          }
          .bill-paid {
            padding: 0.2rem;
            font-size: 0.65rem;
            display: inline-block;
            margin-left: 0.5rem;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;