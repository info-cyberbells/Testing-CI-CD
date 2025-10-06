import React, { useState, useEffect } from 'react';
import { ListGroup } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useMenuItems from '../../../useMenuItems';
import { BASE_TITLE } from '../../../config/constant';

const Breadcrumb = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const menuItems = useMenuItems();
  const [main, setMain] = useState([]);
  const [item, setItem] = useState([]);

  useEffect(() => {
    menuItems.forEach((group, index) => {
      if (group.type && group.type === 'group') {
        getCollapse(group, index);
      }
    });
  }, [menuItems, location.pathname]);

  const getCollapse = (item, index) => {
    if (item.children) {
      item.children.forEach((collapse) => {
        if (collapse.type && collapse.type === 'collapse') {
          getCollapse(collapse, index);
        } else if (collapse.type && collapse.type === 'item') {
          if (location.pathname === collapse.url) {
            setMain(item);
            setItem(collapse);
          }
        }
      });
    }
  };

  let mainContent, itemContent;
  let breadcrumbContent = '';
  let title = '';

  if (main && main.type === 'collapse') {
    mainContent = (
      <ListGroup.Item as="li" bsPrefix=" " className="breadcrumb-item">
        {/* Use translation for main title if needed */}
        {/* <Link to="#">{t(main.translationKey || main.title)}</Link> */}
      </ListGroup.Item>
    );
  }

  if (item && item.type === 'item') {
    // Use translated title from translationKey, fallback to item.title
    title = t(item.translationKey || item.title);
    itemContent = (
      <ListGroup.Item as="li" bsPrefix=" " className="breadcrumb-item">
        <Link to="#">{title}</Link>
      </ListGroup.Item>
    );

    if (item.breadcrumbs !== false) {
      breadcrumbContent = (
        <div className="page-header" style={{
          marginTop: window.innerWidth > 992 ? '-50px' : window.innerWidth > 768 ? '-30px' : window.innerWidth > 576 ? '-15px' : '0px',
          paddingTop: window.innerWidth > 992 ? '15px' : window.innerWidth > 768 ? '10px' : '5px',
          paddingLeft: window.innerWidth <= 768 ? '15px' : '0px',
          paddingRight: window.innerWidth <= 768 ? '15px' : '0px'
        }}>
          <div className="page-block">
            <div className="row align-items-center">
              <div className="col-md-12">
                <div className="page-header-title">
                  <h5 className="m-b-10">{title}</h5>
                </div>
                <ListGroup as="ul" bsPrefix=" " className="breadcrumb">
                  <ListGroup.Item as="li" bsPrefix=" " className="breadcrumb-item">
                    <Link to="/">
                      <i className="feather icon-home" />
                    </Link>
                  </ListGroup.Item>
                  {mainContent}
                  {itemContent}
                </ListGroup>
              </div>
            </div>
          </div>
        </div>
      );
    }

    document.title = title + BASE_TITLE;
  }

  return <React.Fragment>{breadcrumbContent}</React.Fragment>;
};

export default Breadcrumb;