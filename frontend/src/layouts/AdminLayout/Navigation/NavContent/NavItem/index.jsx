import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { ListGroup } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUser, FaUsers, FaChurch, FaUserSlash, FaUserMinus, FaCommentDots, FaUserShield, FaPlay, FaRegComment, FaDonate, FaFileContract, FaBookOpen, FaCalendarAlt, FaShieldAlt, FaChartLine } from 'react-icons/fa'; // Import additional icons as needed


import NavBadge from '../NavBadge';
import { ConfigContext } from '../../../../../contexts/ConfigContext';
import * as actionType from '../../../../../store/actions';
import useWindowSize from '../../../../../hooks/useWindowSize';

// Icon mapping based on the title
const iconMapping = {
  'Dashboard': FaHome,
  'Manage Profile': FaUser,
  'Manage Administrators': FaUserShield,
  'Manage Staff Members': FaUsers,
  'Manage Churches': FaChurch,
  'Manage Users': FaUser,
  'Manage Church': FaChurch,
  'Go Live': FaPlay,
  'Join Live Sermons': FaPlay, //Go Live

  'Daily Devotional': FaPlay,
  'Manage Prayer Request': FaRegComment, //New icon for Prayer Request
  'Manage Donate': FaDonate, //New icon for Donate
  'Manage Events': FaCalendarAlt, //New icon for Donate
  'Events': FaCalendarAlt, //New icon for Donate
  'Privacy Policy': FaShieldAlt,
  'Today Sermon': FaFileContract,
  'Analytics': FaChartLine,
  'Delete My Account': FaUserSlash,
  'Delete Request Accounts': FaUserMinus,
  'Feedback': FaCommentDots,
  'All Feedback': FaCommentDots,





  //portgues
  'Painel': FaHome,
  'Gerenciar Perfil': FaUser,
  'Gerenciar Administradores': FaUserShield,
  'Gerenciar Membros da Equipe': FaUsers,
  'Gerenciar Igrejas': FaChurch,
  'Gerenciar Usuários': FaUser,
  'Gerenciar Igreja': FaChurch,
  'Transmitir ao Vivo': FaPlay,
  'Participar de Sermões ao Vivo': FaPlay, //Go Live

  'Daily Devotional': FaPlay,
  'Manage Prayer Request': FaRegComment, //New icon for Prayer Request
  'Manage Donate': FaDonate, //New icon for Donate
  'Gerenciar Eventos': FaCalendarAlt, //New icon for Donate
  'Eventos': FaCalendarAlt, //New icon for Donate
  'Política de Privacidade': FaShieldAlt,
  'Today Sermon': FaFileContract,
  'Análises': FaChartLine,
  'Excluir Minha Conta': FaUserSlash,
  'Solicitações de Exclusão de Contas': FaUserMinus,
  'Feedback': FaCommentDots,
  'Todos os Feedbacks': FaCommentDots,


  //spanish
  'Tablero': FaHome,
  'Administrar Perfil': FaUser,
  'Administrar Administradores': FaUserShield,
  'Administrar Miembros del Personal': FaUsers,
  'Administrar Iglesias': FaChurch,
  'Administrar Usuarios': FaUser,
  'Administrar Iglesia': FaChurch,
  'Transmitir en Vivo': FaPlay,
  'Unirse a Sermones en Vivo': FaPlay, //Go Live

  'Daily Devotional': FaPlay,
  'Manage Prayer Request': FaRegComment, //New icon for Prayer Request
  'Manage Donate': FaDonate, //New icon for Donate
  'Administrar Eventos': FaCalendarAlt, //New icon for Donate
  'Eventos': FaCalendarAlt, //New icon for Donate
  'Política de Privacidad': FaShieldAlt,
  'Today Sermon': FaFileContract,
  'Analíticas': FaChartLine,
  'Eliminar Mi Cuenta': FaUserSlash,
  'Solicitudes de Eliminación de Cuentas': FaUserMinus,
  'Comentarios': FaCommentDots,
  'Todos los Comentarios': FaCommentDots,


  //indonasia
  'Dasbor': FaHome,
  'Kelola Profil': FaUser,
  'Kelola Administrator': FaUserShield,
  'Kelola Anggota Staf': FaUsers,
  'Kelola Gereja': FaChurch,
  'Kelola Pengguna': FaUser,
  'Kelola Gereja': FaChurch,
  'Siaran Langsung': FaPlay,
  'Bergabung dengan Khotbah Langsung': FaPlay, //Go Live

  'Daily Devotional': FaPlay,
  'Manage Prayer Request': FaRegComment, //New icon for Prayer Request
  'Manage Donate': FaDonate, //New icon for Donate
  'Kelola Acara': FaCalendarAlt, //New icon for Donate
  'Acara': FaCalendarAlt, //New icon for Donate
  'Kebijakan Privasi': FaShieldAlt,
  'Today Sermon': FaFileContract,
  'Analitik': FaChartLine,
  'Hapus Akun Saya': FaUserSlash,
  'Permintaan Penghapusan Akun': FaUserMinus,
  'Masukan': FaCommentDots,
  'Semua Masukan': FaCommentDots,



  //mandrian
  '仪表板': FaHome,
  '管理个人资料': FaUser,
  '管理管理员': FaUserShield,
  '管理员工': FaUsers,
  '管理教会': FaChurch,
  '管理用户': FaUser,
  '管理教会': FaChurch,
  '直播': FaPlay,
  '加入直播讲道': FaPlay,

  'Daily Devotional': FaPlay,
  'Manage Prayer Request': FaRegComment, //New icon for Prayer Request
  'Manage Donate': FaDonate, //New icon for Donate
  '管理活动': FaCalendarAlt, //New icon for Donate
  '活动': FaCalendarAlt, //New icon for Donate
  '隐私政策': FaShieldAlt,
  'Today Sermon': FaFileContract,
  '分析': FaChartLine,
  '删除我的账户': FaUserSlash,
  '账户删除请求': FaUserMinus,
  '反馈': FaCommentDots,
  '所有反馈': FaCommentDots,
};

const NavItem = ({ item }) => {
  const
    {
      title = '',
      target = '',
      external = false,
      url = '',
      classes = ''
    } = item;

  const windowSize = useWindowSize();
  const configContext = useContext(ConfigContext);
  const { dispatch } = configContext;

  // Get the appropriate icon based on the title from iconMapping
  const IconComponent = iconMapping[title] || null;

  // Render the item title with the icon if available
  let itemTitle;
  if (IconComponent) {
    itemTitle = (
      <span className="pcoded-mtext">
        <IconComponent style={{ marginRight: '8px', color: 'white' }} />
        {title}
        {/* <hr style={{ 
        margin: '10px 0',
        border: 'none',
        height: '1px',
        backgroundColor: '#ffff'
      }} /> */}
      </span>
    );
  } else {
    itemTitle = title;
  }

  // Set target if specified
  let itemTarget;
  if (target) {
    itemTarget = '_blank';
  }

  // SubContent: For external links or internal navigation
  let subContent;
  if (external) {
    subContent = (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {itemTitle}
        <NavBadge items={item} />
      </a>
    );
  } else {
    subContent = (
      <NavLink to={url} className="nav-link" target={itemTarget}>
        {itemTitle}
        <NavBadge items={item} />
      </NavLink>
    );
  }

  // Main content based on screen size
  let mainContent;
  if (windowSize.width < 992) {
    mainContent = (
      <ListGroup.Item
        as="li"
        bsPrefix=" "
        className={classes}
        onClick={() => dispatch({ type: actionType.COLLAPSE_MENU })}
      >
        {subContent}
      </ListGroup.Item>
    );
  } else {
    mainContent = (
      <ListGroup.Item as="li" bsPrefix=" " className={classes}>
        {subContent}
      </ListGroup.Item>
    );
  }

  return <React.Fragment>{mainContent}</React.Fragment>;
};

// Define PropTypes
NavItem.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    target: PropTypes.string,
    external: PropTypes.bool,
    url: PropTypes.string,
    classes: PropTypes.string,
  }).isRequired,
};

export default NavItem;
