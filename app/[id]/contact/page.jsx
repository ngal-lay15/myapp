"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Home = ({params}) => (
  <div>
    <Header params={params.id}/>
    <main>
      <h1>Welcome to Our Restaurant</h1>
      <p>Discover our delicious menu and great atmosphere.</p>
      {params.id}
    </main>
  </div>
);

export default Home;
