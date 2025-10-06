import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ConfigContext } from '../../../../contexts/ConfigContext';
import * as actionType from '../../../../store/actions';
import sidebarLogo from '../../../../assets/images/church white.png';


const NavLogo = ({ userImage }) => {
  const navigate = useNavigate();
  const configContext = useContext(ConfigContext);
  const { collapseMenu } = configContext.state;
  const { dispatch } = configContext;

  let toggleClass = ['mobile-menu'];
  if (collapseMenu) {
    toggleClass = [...toggleClass, 'on'];
  }
  const handleLogoClick = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };
  return (
    <React.Fragment>
      <div className="navbar-brand header-logo bg-b" >
        <Link to="#" className="b-brand">
          <div className="b-b " >            
          <img 
              src={sidebarLogo} 
              alt="Church Translator" 
              className="b-title logo-image" 
              onClick={handleLogoClick}
              style={{ 
                height: '25px', 
                objectFit: 'contain',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} 
            />
            {/* {userImage ? (
              <img src={userImage} alt="User" style={{ width: '40px', borderRadius: '50%' }} />
            ) : (
              <i className="feather icon-trending-up" />
            )} */}
          </div>
          {/* <span className="b-title">Church Translator123</span> */}
        </Link>
        {/* <Link
          to="#"
          className={toggleClass.join(' ')}
          id="mobile-collapse"
          onClick={() => dispatch({ type: actionType.COLLAPSE_MENU })}
        >
          <span />
        </Link> */}
      </div>
      
    </React.Fragment>
  );
};

export default NavLogo;
