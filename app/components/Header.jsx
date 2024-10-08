import { useState, useEffect } from 'react';
import Link from 'next/link';
import logo from '../../img/logo.png';
import cartimg from '../../img/cart.png';
import { useCart } from '../../CartContext';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter } from 'next/navigation';

const Modal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h6>ဘေပေးဆောင်ရန် အတွက် request လုပ်ပြီးဖြစ်ပါသည်။အားပေးမှုအတွက် အထူးကျေးဇူးတင်ပါသည် ခင်ဗျာ။</h6>
        <button onClick={onClose}>Close</button>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          width: 300px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        button {
          background: orange;
          border: none;
          color: white;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

const Header = ({ params }) => {
  const { cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [items, setItems] = useState([]);
  const [foodSubcategories, setFoodSubcategories] = useState([]);
  const [drinkSubcategories, setDrinkSubcategories] = useState([]);
  const [isBillPaidEnabled, setIsBillPaidEnabled] = useState(false);
  const [showFoodSubmenu, setShowFoodSubmenu] = useState(false);
  const [showDrinkSubmenu, setShowDrinkSubmenu] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemsCollection = collection(db, '1/products/items');
        const itemsSnapshot = await getDocs(itemsCollection);
        const itemsList = itemsSnapshot.docs.map((doc) => ({
          name: doc.data().name,
          id: doc.id,
          category: doc.data().category,
          subcategory: doc.data().subcategory,
        }));
        setItems(itemsList);

        const foodItems = itemsList.filter(item => item.category === 'Food');
        const uniqueFoodSubcategories = [...new Set(foodItems.map(item => item.subcategory))];
        setFoodSubcategories(uniqueFoodSubcategories);

        const drinkItems = itemsList.filter(item => item.category === 'Drink');
        const uniqueDrinkSubcategories = [...new Set(drinkItems.map(item => item.subcategory))];
        setDrinkSubcategories(uniqueDrinkSubcategories);

      } catch (error) {
        console.error('Error fetching items: ', error);
      }
    };

    fetchItems();
  }, []);

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

        return () => unsubscribeBilling();
      });

      return () => unsubscribeDelivered();
    });

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

      setModalMessage('Bill successfully paid!');
      setIsBillPaidEnabled(false);
    } catch (error) {
      setModalMessage('Error paying bill. Please try again.');
      console.error('Error paying bill: ', error);
    }
    setIsModalOpen(true);
  };

  const toggleFoodSubmenu = () => {
    setShowFoodSubmenu(!showFoodSubmenu);
    setShowDrinkSubmenu(false);
  };

  const toggleDrinkSubmenu = () => {
    setShowDrinkSubmenu(!showDrinkSubmenu);
    setShowFoodSubmenu(false);
  };

  const handleSubmenuItemClick = (subcategory, category) => {
    setSelectedSubcategory(subcategory);
    if (category === 'Food') {
      router.push(`/${params}/food/${subcategory}`);
    } else if (category === 'Drink') {
      router.push(`/${params}/drink/${subcategory}`);
    }
    setShowFoodSubmenu(false);
    setShowDrinkSubmenu(false);
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

          <li style={{ fontSize: '10px' }} className="left-section food-menu">
            <span onClick={toggleFoodSubmenu} className="nav-link">
              Food 
            </span>
            {showFoodSubmenu && (
              <ul className="submenu">
                {foodSubcategories.map((subcategory, index) => (
                  <li key={index} onClick={() => handleSubmenuItemClick(subcategory, 'Food')}>
                    {subcategory}
                  </li>
                ))}
              </ul>
            )}
          </li>

          <li style={{ fontSize: '10px' }} className="left-section">
            <span onClick={toggleDrinkSubmenu} className="nav-link">
              Drink 
            </span>
            {showDrinkSubmenu && (
              <ul className="submenu">
                {drinkSubcategories.map((subcategory, index) => (
                  <li key={index} onClick={() => handleSubmenuItemClick(subcategory, 'Drink')}>
                    {subcategory}
                  </li>
                ))}
              </ul>
            )}
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
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} message={modalMessage} />
        
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
          cursor: pointer;
        }
        .left-section {
          display: flex;
          align-items: center;
        }
        .food-menu {
          z-index: 100;
        }
        .submenu {
          position: absolute;
          top: 100%;
          left: 0;
          width: 200px;
          background: white;
          border: 1px solid orange;
          border-radius: 4px;
          list-style: none;
          padding: 0;
          margin: 0;
          z-index: 9999;
        }
        .submenu li {
          padding: 0.75rem;
          cursor: pointer;
          border-bottom: 1px solid orange;
          text-align: left;
          display: block;
          width: 100%;
        }
        .submenu li:hover {
          background-color: orange;
          color: white;
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
          display: block;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
        }
        .dropdown li {
          padding: 0.75rem;
          cursor: pointer;
          background-color: #fff;
          border: 1px solid orange;
          border-radius: 4px;
          text-align: left;
          display: block;
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