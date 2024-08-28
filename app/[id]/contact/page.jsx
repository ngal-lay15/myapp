"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Home = ({params}) => (
  <div>
    <Header params={params.id}/>
    <main  style={{marginTop:'70px'}}>
      <h4>htwocoder@gmai.com</h4>
      <p>Discover our delicious menu and great atmosphere.</p>
    </main>
  </div>
);

export default Home;
