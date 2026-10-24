import React, { useState, useEffect } from 'react';
import {
  Button, Input, Card, Form, Select, DatePicker, Row, Col, Table, Tag, Space, Divider, ConfigProvider,
  Typography, message, InputNumber, Avatar, Tabs, Modal, Dropdown, List
} from 'antd';
import viVN from 'antd/locale/vi_VN';
import {
  ApartmentOutlined, UserOutlined, SaveOutlined, CloseOutlined, SearchOutlined, DeleteOutlined,
  DownloadOutlined, UploadOutlined, DownOutlined, EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

// --- CẤU HÌNH FIREBASE ONLINE & AUTH ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY_HERE",
//   authDomain: "giapha-120ef.firebaseapp.com",
//   projectId: "giapha-120ef",
//   storageBucket: "giapha-120ef.appspot.com",
//   messagingSenderId: "SENDER_ID",
//   appId: "APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAVXfEehKIiorP_Bcs6EuzmjXjPcuAqkbE",
  authDomain: "giapha-120ef.firebaseapp.com",
  projectId: "giapha-120ef",
  storageBucket: "giapha-120ef.firebasestorage.app",
  messagingSenderId: "19341918825",
  appId: "1:19341918825:web:8d7ea12d08bddda9a2d8f8",
  measurementId: "G-ZVP74VB67X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DANH SÁCH CÁC TÀI KHOẢN ĐƯỢC QUYỀN QUẢN TRỊ (THÊM, SỬA, XÓA)
const ADMIN_EMAILS = [
  'chuonghv@gmail.com',
  'trunghpb@gmail.com'
];
// ---------------------------------

const { Title, Text } = Typography;
const { TextArea } = Input;

const defaultData = [
  {
    key: "1",
    name: "Hoàng Diệu",
    doi: 1,
    nhanhThu: 0,
    conThu: 1,
    ngaySinh: "1920-01-01",
    gioiTinh: "nam",
    avatar: "",
    parentKey: "",
    conOngName: "",
    conOngNgaySinh: "",
    conBaName: "",
    conBaNgaySinh: "",
    tieuSu: "- Người đặt nền móng dòng họ.\n- Có công lớn với gia tộc.",
    pn1_name: "Trần Thị Thoá",
    pn1_ngaySinh: "1922-05-10",
    pn1_gioiTinh: "nu",
    pn1_avatar: "",
    pn1_tieuSu: "- Hiền hậu, đảm đang.\n- Nuôi dạy con cháu trưởng thành.",
    pn2_name: "",
    pn2_ngaySinh: "",
    pn2_gioiTinh: "nu",
    pn2_avatar: "",
    pn2_tieuSu: "",
    children: []
  }
];

const migrateData = (nodes) => {
  if (!Array.isArray(nodes)) return defaultData;
  return nodes.map(node => ({
    ...node,
    gioiTinh: node.gioiTinh || (node.name?.toLowerCase().includes('thị') ? 'nu' : 'nam'),
    pn1_gioiTinh: node.pn1_gioiTinh || (node.pn1_name?.toLowerCase().includes('thị') ? 'nu' : 'nam'),
    pn2_gioiTinh: node.pn2_gioiTinh || (node.pn2_name?.toLowerCase().includes('thị') ? 'nu' : 'nam'),
    children: node.children ? migrateData(node.children) : []
  }));
};

export default function App() {
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loginForm] = Form.useForm();

  const [treeData, setTreeData] = useState(defaultData);
  const [user, setUser] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Kiểm tra xem người dùng đăng nhập hiện tại có nằm trong danh sách Admin không
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const handleLogin = (values) => {
    signInWithEmailAndPassword(auth, values.email, values.password)
      .then(() => {
        message.success("Đăng nhập thành công!");
        setLoginModalVisible(false);
        loginForm.resetFields();
      })
      .catch((error) => {
        console.error(error);
        message.error("Sai tài khoản hoặc mật khẩu đăng nhập!");
      });
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      message.info("Đã đăng xuất tài khoản.");
    }).catch((error) => {
      console.error(error);
    });
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "giapha", "dinhchi"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const savedData = docSnapshot.data();
        let remoteData = savedData.nodes;
        if (typeof savedData.nodesJson === 'string') {
          try {
            remoteData = JSON.parse(savedData.nodesJson);
          } catch (error) {
            console.error("Dữ liệu gia phả trên hệ thống trực tuyến không hợp lệ:", error);
            message.error("Dữ liệu gia phả trên hệ thống trực tuyến bị lỗi!");
            return;
          }
        }
        if (Array.isArray(remoteData)) {
          setTreeData(migrateData(remoteData));
        }
      } else {
        setDoc(doc(db, "giapha", "dinhchi"), { nodesJson: JSON.stringify(defaultData) }).catch((error) => {
          console.error("Lỗi khởi tạo dữ liệu gia phả:", error);
          message.error("Không thể khởi tạo dữ liệu trên hệ thống trực tuyến!");
        });
      }
    }, (error) => {
      console.error("Lỗi tải dữ liệu gia phả:", error);
      message.error("Không thể tải dữ liệu từ hệ thống trực tuyến!");
    });
    return () => unsubscribe();
  }, []);

  const saveToCloud = async (newData) => {
    try {
      await setDoc(doc(db, "giapha", "dinhchi"), { nodesJson: JSON.stringify(newData) });
      return true;
    } catch (e) {
      console.error("Lỗi đồng bộ mây: ", e);
      message.error("Không thể lưu dữ liệu lên hệ thống trực tuyến!");
      return false;
    }
  };

  const [selectedKey, setSelectedKey] = useState("1");
  const [searchText, setSearchText] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [targetMember, setTargetMember] = useState(null);
  const [targetBranch, setTargetBranch] = useState(1);

  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewModalType, setViewModalType] = useState('');
  const [viewHtmlContent, setViewHtmlContent] = useState('');
  const [isViewSelectorModalVisible, setIsViewSelectorModalVisible] = useState(false);

  const [addPn1Avatar, setAddPn1Avatar] = useState("");
  const [addPn2Avatar, setAddPn2Avatar] = useState("");
  const [editPn1Avatar, setEditPn1Avatar] = useState("");
  const [editPn2Avatar, setEditPn2Avatar] = useState("");

  const findNode = (nodes, key) => {
    if (!nodes || !Array.isArray(nodes)) return null;
    for (let n of nodes) {
      if (n.key === key) return n;
      if (n.children?.length > 0) {
        const f = findNode(n.children, key);
        if (f) return f;
      }
    }
    return null;
  };

  const getGenealogySortedList = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return [];
    let result = [];
    let queue = [...nodes];
    
    while (queue.length > 0) {
      let current = queue.shift();
      if (current) {
        result.push(current);
        if (current.children && current.children.length > 0) {
          let sortedChildren = [...current.children].sort((a, b) => (a.conThu || 1) - (b.conThu || 1));
          queue.push(...sortedChildren);
        }
      }
    }

    let maxDoi = result.reduce((max, n) => Math.max(max, n?.doi || 1), 1);
    let finalSorted = [];

    for (let d = 1; d <= maxDoi; d++) {
      let membersInDoi = result.filter(n => (n?.doi || 1) === d);
      membersInDoi.sort((a, b) => {
        let parentA = result.find(n => n?.key === a?.parentKey);
        let parentB = result.find(n => n?.key === b?.parentKey);
        
        if (parentA && parentB && parentA.key !== parentB.key) {
          return result.indexOf(parentA) - result.indexOf(parentB);
        }
        return (a?.conThu || 1) - (b?.conThu || 1);
      });
      finalSorted = finalSorted.concat(membersInDoi);
    }

    return finalSorted;
  };

  const sortedList = getGenealogySortedList(treeData);
  const selectedMember = findNode(treeData, selectedKey) || sortedList[0] || defaultData[0];

  useEffect(() => {
    if (selectedMember) {
      try {
        editForm.setFieldsValue({
          ...selectedMember,
          ngaySinh: selectedMember.ngaySinh ? dayjs(selectedMember.ngaySinh) : null,
          pn1_ngaySinh: selectedMember.pn1_ngaySinh ? dayjs(selectedMember.pn1_ngaySinh) : null,
          pn2_ngaySinh: selectedMember.pn2_ngaySinh ? dayjs(selectedMember.pn2_ngaySinh) : null,
        });
        setEditPn1Avatar(selectedMember.pn1_avatar || "");
        setEditPn2Avatar(selectedMember.pn2_avatar || "");
      } catch (err) {
        console.error(err);
      }
    }
  }, [selectedKey, treeData]);

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(treeData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `SaoLuu_GiaPha_${dayjs().format('YYYY-MM-DD_HHmmss')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      message.success('Đã tải xuống file sao lưu dữ liệu thành công!');
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi xuất file sao lưu!');
    }
  };

  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    const input = e.target;
    const file = input.files?.[0];
    if (file) {
      input.value = '';
      fileReader.readAsText(file, "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const backup = JSON.parse(event.target?.result);
          const importedData = Array.isArray(backup) ? backup : backup?.nodes;
          if (Array.isArray(importedData) && importedData.every(node => node && typeof node === 'object' && !Array.isArray(node))) {
            const migrated = migrateData(importedData);
            const saved = await saveToCloud(migrated);
            if (!saved) return;

            setTreeData(migrated);
            if (migrated.length > 0) {
              setSelectedKey(migrated[0].key);
            }
            message.success('Phục hồi và đồng bộ dữ liệu lên hệ thống trực tuyến thành công!');
          } else {
            message.error('Tệp sao lưu không đúng định dạng. Vui lòng chọn tệp JSON gia phả hợp lệ!');
          }
        } catch (error) {
          console.error(error);
          message.error('Không thể đọc file JSON này!');
        }
      };
      fileReader.onerror = (error) => {
        console.error(error);
        message.error('Không thể đọc file JSON này!');
      };
    }
  };

  const updateNodeInTree = (nodes, key, newValues) => {
    return nodes.map(n => {
      if (n.key === key) {
        return { ...n, ...newValues };
      }
      if (n.children && n.children.length > 0) {
        return { ...n, children: updateNodeInTree(n.children, key, newValues) };
      }
      return n;
    });
  };

  const removeNodeFromTree = (nodes, key) => {
    return nodes.filter(n => n.key !== key).map(n => {
      if (n.children && n.children.length > 0) {
        return { ...n, children: removeNodeFromTree(n.children, key) };
      }
      return n;
    });
  };

  const handleAvatarRead = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
      message.success('Tải ảnh thành công!');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const fDate = (d) => {
    if (!d) return 'Chưa rõ';
    const parsed = dayjs(d);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY') : d;
  };

  const isMale = (node) => {
    if (!node) return false;
    if (node.gioiTinh) return node.gioiTinh === 'nam';
    return !node.name?.toLowerCase().includes('thị');
  };

  const formatTieuSuToHtml = (text) => {
    if (!text) return '<div style="font-size:12pt; text-align:left; font-weight:normal;">Chưa có tiểu sử.</div>';
    let lines = text.split('\n');
    let html = '';
    lines.forEach(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('-')) {
        html += `<div style="font-size:12pt; text-align:left; font-weight:normal; margin-bottom:3px;">${trimmed}</div>`;
      } else if (trimmed !== '') {
        html += `<div style="font-size:12pt; text-align:left; font-weight:normal; margin-bottom:3px;">- ${trimmed}</div>`;
      }
    });
    return html || `<div style="font-size:12pt; text-align:left; font-weight:normal;">${text}</div>`;
  };

  const handleParentChange = (parentKey) => {
    const parent = findNode(treeData, parentKey);
    if (parent) {
      addForm.setFieldsValue({
        doi: parent.doi + 1,
        nhanhThu: parent.nhanhThu || 0,
        conOngName: parent.name,
        conOngNgaySinh: parent.ngaySinh ? fDate(parent.ngaySinh) : '',
        conBaName: parent.pn1_name || '',
        conBaNgaySinh: parent.pn1_ngaySinh ? fDate(parent.pn1_ngaySinh) : '',
      });
    }
  };

  const onFinishAdd = (values) => {
    try {
      const parentNode = findNode(treeData, values.parentKey);
      const newDoi = parentNode ? parentNode.doi + 1 : 1;
      const newKey = values.parentKey + "-" + Date.now();

      const newNode = {
        key: newKey,
        name: values.name || 'Chưa đặt tên',
        doi: newDoi,
        nhanhThu: values.nhanhThu || 0,
        conThu: values.conThu || 1,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : '',
        gioiTinh: values.gioiTinh || 'nam',
        avatar: values.avatar || '',
        parentKey: values.parentKey,
        conOngName: values.conOngName || (parentNode ? parentNode.name : ''),
        conOngNgaySinh: values.conOngNgaySinh || (parentNode ? parentNode.ngaySinh : ''),
        conBaName: values.conBaName || (parentNode ? (parentNode.pn1_name || '') : ''),
        conBaNgaySinh: values.conBaNgaySinh || (parentNode ? (parentNode.pn1_ngaySinh || '') : ''),
        tieuSu: values.tieuSu || '',
        pn1_name: values.pn1_name || '',
        pn1_ngaySinh: values.pn1_ngaySinh ? values.pn1_ngaySinh.format('YYYY-MM-DD') : '',
        pn1_gioiTinh: values.pn1_gioiTinh || 'nu',
        pn1_avatar: addPn1Avatar,
        pn1_tieuSu: values.pn1_tieuSu || '',
        pn2_name: values.pn2_name || '',
        pn2_ngaySinh: values.pn2_ngaySinh ? values.pn2_ngaySinh.format('YYYY-MM-DD') : '',
        pn2_gioiTinh: values.pn2_gioiTinh || 'nu',
        pn2_avatar: addPn2Avatar,
        pn2_tieuSu: values.pn2_tieuSu || '',
        children: []
      };

      const addRecursive = (nodes) => nodes.map(n => {
        if (n.key === values.parentKey) {
          return { ...n, children: [...(n.children || []), newNode] };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: addRecursive(n.children) };
        }
        return n;
      });

      const updated = addRecursive(treeData);
      setTreeData(updated);
      saveToCloud(updated);
      setSelectedKey(newKey);
      message.success('Đã thêm thành viên mới lên hệ thống trực tuyến!');
      addForm.resetFields();
      setAddPn1Avatar("");
      setAddPn2Avatar("");
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi thêm thành viên mới!');
    }
  };

  const handleCancelAdd = () => {
    addForm.resetFields();
    setAddPn1Avatar("");
    setAddPn2Avatar("");
    message.info('Đã bỏ qua nhập liệu.');
  };

  const onFinishEdit = (values) => {
    if (!selectedKey) return;
    try {
      const formattedValues = {
        ...values,
        doi: values.doi || 1,
        ngaySinh: values.ngaySinh ? (dayjs.isDayjs(values.ngaySinh) ? values.ngaySinh.format('YYYY-MM-DD') : values.ngaySinh) : '',
        conOngNgaySinh: values.conOngNgaySinh || '',
        conBaNgaySinh: values.conBaNgaySinh || '',
        pn1_ngaySinh: values.pn1_ngaySinh ? (dayjs.isDayjs(values.pn1_ngaySinh) ? values.pn1_ngaySinh.format('YYYY-MM-DD') : values.pn1_ngaySinh) : '',
        pn2_ngaySinh: values.pn2_ngaySinh ? (dayjs.isDayjs(values.pn2_ngaySinh) ? values.pn2_ngaySinh.format('YYYY-MM-DD') : values.pn2_ngaySinh) : '',
        pn1_avatar: editPn1Avatar,
        pn2_avatar: editPn2Avatar,
      };

      const updated = updateNodeInTree(treeData, selectedKey, formattedValues);
      setTreeData(updated);
      saveToCloud(updated);
      message.success('Đã cập nhật thay đổi trực tuyến thành công!');
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi cập nhật thông tin!');
    }
  };

  const handleCancelEdit = () => {
    if (selectedMember) {
      editForm.setFieldsValue({
        ...selectedMember,
        ngaySinh: selectedMember.ngaySinh ? dayjs(selectedMember.ngaySinh) : null,
        pn1_ngaySinh: selectedMember.pn1_ngaySinh ? dayjs(selectedMember.pn1_ngaySinh) : null,
        pn2_ngaySinh: selectedMember.pn2_ngaySinh ? dayjs(selectedMember.pn2_ngaySinh) : null,
      });
      setEditPn1Avatar(selectedMember.pn1_avatar || "");
      setEditPn2Avatar(selectedMember.pn2_avatar || "");
      message.info('Đã khôi phục thông tin ban đầu.');
    }
  };

  const handleDeleteMember = () => {
    if (treeData.length === 1 && treeData[0].key === selectedKey) {
      message.error('Không thể xóa cụ tổ đầu dòng họ!');
      return;
    }
    Modal.confirm({
      title: 'Xác nhận xóa thành viên',
      content: `Bạn có chắc chắn muốn xóa "${selectedMember?.name}" và toàn bộ nhánh con trực hệ không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk() {
        try {
          const newData = removeNodeFromTree(treeData, selectedKey);
          setTreeData(newData);
          saveToCloud(newData);
          if (newData.length > 0) {
            setSelectedKey(newData[0].key);
          }
          message.success('Đã xóa thành viên thành công!');
        } catch (err) {
          console.error(err);
          message.error('Lỗi khi xóa thành viên!');
        }
      }
    });
  };

  const getStt = (node) => `${node.doi || 1}.${node.conThu || 1}- `;

  const getDx = (isMemberMale) => {
    return isMemberMale ? 'Vợ:' : 'Chồng:';
  };

  const getGenerationColor = (doi) => {
    switch (doi) {
      case 1: return '#cc0000';
      case 2: return '#006400';
      case 3: return '#000080';
      case 4: return '#b8860b';
      case 5: return '#8b008b';
      case 6: return '#008b8b';
      default: return '#333333';
    }
  };

  const renderStrictGridTable = (membersList, titlePrefix = '') => {
    if (!membersList || membersList.length === 0) return '';

    let count = membersList.length;
    let tableWidth = count <= 1 ? '30%' : count === 2 ? '50%' : count === 3 ? '70%' : '100%';

    let html = '';

    html += `<table align="center" width="${tableWidth}" border="0" cellspacing="0" cellpadding="2" style="border-collapse:collapse; margin: 0 auto; margin-bottom:15px; table-layout:fixed;">`;
    
    html += `<tr>`;
    membersList.forEach((m, idx) => {
      html += `<td style="vertical-align:bottom; text-align:center; padding:2px; font-size:12pt; font-weight:normal; color:#000;">`;
      html += `${titlePrefix || 'Con thứ'} ${idx + 1}`;
      html += `</td>`;
    });
    html += `</tr>`;

    html += `<tr>`;
    membersList.forEach((m) => {
      html += `<td style="vertical-align:middle; text-align:center; padding:2px; height:105px;">`;
      if (m.avatar) {
        html += `<img src="${m.avatar}" width="75" height="98" style="object-fit:cover; border:1px solid #999; display:block; margin:0 auto;" />`;
      } else {
        html += `<div style="width:75px; height:98px; border:1px dashed #aaa; display:block; margin:0 auto; line-height:98px; text-align:center; color:#888; font-size:9.5pt; background:#f8f9fa;">Ảnh 3x4</div>`;
      }
      html += `</td>`;
    });
    html += `</tr>`;

    html += `<tr>`;
    membersList.forEach((m) => {
      html += `<td style="vertical-align:top; text-align:center; padding:2px; height:50px; font-size:12pt; line-height:1.2;">`;
      html += `<div style="font-weight:bold; color:#000;">${m.name}</div>`;
      html += `<div style="font-size:12pt; color:#000;">NS: ${fDate(m.ngaySinh)}</div>`;
      html += `</td>`;
    });
    html += `</tr>`;

    let hasAnySpouse = membersList.some(m => m.pn1_name && m.pn1_name.trim() !== '');

    if (hasAnySpouse) {
      html += `<tr>`;
      membersList.forEach((m) => {
        let hasSpouse = m.pn1_name && m.pn1_name.trim() !== '';
        html += `<td style="vertical-align:middle; text-align:center; padding:2px; height:105px;">`;
        if (hasSpouse) {
          if (m.pn1_avatar) {
            html += `<img src="${m.pn1_avatar}" width="75" height="98" style="object-fit:cover; border:1px solid #999; display:block; margin:0 auto;" />`;
          } else {
            html += `<div style="width:75px; height:98px; border:1px dashed #aaa; display:block; margin:0 auto; line-height:98px; text-align:center; color:#888; font-size:9.5pt; background:#f8f9fa;">Ảnh PN</div>`;
          }
        }
        html += `</td>`;
      });
      html += `</tr>`;

      html += `<tr>`;
      membersList.forEach((m) => {
        let hasSpouse = m.pn1_name && m.pn1_name.trim() !== '';
        let dxValue = isMale(m) ? 'Vợ:' : 'Chồng:';
        html += `<td style="vertical-align:top; text-align:center; padding:2px; height:45px; font-size:12pt; line-height:1.2;">`;
        if (hasSpouse) {
          html += `<div style="color:#000;">${dxValue} <b>${m.pn1_name}</b></div>`;
          html += `<div style="font-size:12pt; color:#000;">NS: ${fDate(m.pn1_ngaySinh)}</div>`;
        }
        html += `</td>`;
      });
      html += `</tr>`;
    }

    html += `</table>`;
    return html;
  };

  const generateContentHtml = (type, subType = '') => {
    const maxDoi = sortedList.reduce((max, item) => item.doi > max ? item.doi : max, 1);
    let bodyHtml = '';
    let member = targetMember || selectedMember;

    if (type === 'single') {
      let i = member;
      let spouseName = i.pn1_name || '';
      let spouseName2 = i.pn2_name || '';
      let danhXungSpouse = (i.pn1_gioiTinh === 'nam' || !spouseName.toLowerCase().includes('thị')) ? 'Họ tên chồng' : 'Họ tên vợ';

      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:14pt; text-transform:uppercase; margin-bottom:12px;">HỒ SƠ TÓM LƯỢC CÁ NHÂN</div>`;

      bodyHtml += `<table width="100%" border="0" style="margin-bottom:12px; border-collapse:collapse;">`;
      bodyHtml += `<tr>`;
      
      bodyHtml += `<td style="vertical-align:middle; font-size:12pt; line-height: 1.5; font-family: 'Times New Roman', Times, serif; padding-right: 15px;">`;
      bodyHtml += `<div style="font-weight:bold; font-size:12pt; text-align:left; margin-bottom:4px;">Họ và tên: ${i.name}</div>`;
      bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">Ngày sinh: ${fDate(i.ngaySinh)}</div>`;
      
      if (spouseName && spouseName.trim() !== '') {
        bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">${danhXungSpouse}: ${spouseName}</div>`;
        bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">Ngày sinh: ${fDate(i.pn1_ngaySinh)}</div>`;
      }
      
      if (spouseName2 && spouseName2.trim() !== '') {
        let danhXungSpouse2 = (i.pn2_gioiTinh === 'nam' || !spouseName2.toLowerCase().includes('thị')) ? 'Họ tên chồng' : 'Họ tên vợ';
        bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">${danhXungSpouse2}: ${spouseName2}</div>`;
        bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">Ngày sinh: ${fDate(i.pn2_ngaySinh)}</div>`;
      }
      
      bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">Họ tên cha: ${i.conOngName || 'Chưa rõ'}, Ngày sinh: ${fDate(i.conOngNgaySinh)}</div>`;
      bodyHtml += `<div style="font-size:12pt; text-align:left; margin-bottom:4px;">Họ tên mẹ: ${i.conBaName || 'Chưa rõ'}, Ngày sinh: ${fDate(i.conBaNgaySinh)}</div>`;
      bodyHtml += `</td>`;

      bodyHtml += `<td style="vertical-align:middle; text-align:center; width:150px;">`;
      bodyHtml += `<div style="margin-left: -5.5cm; position: relative;">`;
      if (i.avatar) {
        bodyHtml += `<img src="${i.avatar}" width="113" height="170" style="object-fit:cover; border:1px solid #bbb; display:block; margin:0 auto;" />`;
      } else {
        bodyHtml += `<div style="width:113px; height:170px; border:1px dashed #bbb; display:inline-block; line-height:170px; text-align:center; color:#888; font-size:10pt; background:#fafafa;">Ảnh 4x6</div>`;
      }
      bodyHtml += `<div style="font-size:10pt; font-style:italic; text-align:center; margin-top:4px;">${i.name}</div>`;
      bodyHtml += `</div>`;
      bodyHtml += `</td>`;
      
      bodyHtml += `</tr>`;
      bodyHtml += `</table>`;

      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; text-transform:uppercase; margin-top:12px; margin-bottom:8px;">SƠ LƯỢC LỊCH SỬ CÁ NHÂN</div>`;
      bodyHtml += `<div style="font-size:12pt; font-weight:bold; text-decoration:underline; text-align:left; margin-bottom:4px;">PHẦN BẢN THÂN:</div>`;
      bodyHtml += formatTieuSuToHtml(i.tieuSu);

      if (spouseName && spouseName.trim() !== '') {
        let phanSpouseTitle = (i.pn1_gioiTinh === 'nam' || !spouseName.toLowerCase().includes('thị')) ? 'PHẦN CHỒNG:' : 'PHẦN VỢ:';
        
        if (!spouseName2 || spouseName2.trim() === '') {
          bodyHtml += `<div style="font-size:12pt; font-weight:bold; text-decoration:underline; text-align:left; margin-top:10px; margin-bottom:4px;">${phanSpouseTitle}</div>`;
          bodyHtml += formatTieuSuToHtml(i.pn1_tieuSu);
        } else {
          bodyHtml += `<div style="font-size:12pt; font-weight:bold; text-decoration:underline; text-align:left; margin-top:10px; margin-bottom:4px;">${phanSpouseTitle}</div>`;
          
          bodyHtml += `<div style="font-size:12pt; font-weight:bold; text-decoration:underline; text-align:left; margin-top:6px; margin-bottom:4px;">Vợ 1:</div>`;
          bodyHtml += formatTieuSuToHtml(i.pn1_tieuSu);

          bodyHtml += `<div style="font-size:12pt; font-weight:bold; text-decoration:underline; text-align:left; margin-top:6px; margin-bottom:4px;">Vợ 2:</div>`;
          bodyHtml += formatTieuSuToHtml(i.pn2_tieuSu);
        }
      }
    } 
    else if (type === 'family') {
      let i = member;
      let children = i.children || [];
      let X = children.length;

      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:14pt; text-transform:uppercase; margin-bottom:12px;">GIA PHẢ GIA ĐÌNH ÔNG ${i.name}</div>`;
      
      bodyHtml += `<table align="center" border="0" cellspacing="0" cellpadding="4" style="margin: 0 auto; margin-bottom:15px; border-collapse:collapse; text-align:center;">`;
      bodyHtml += `<tr>`;
      
      bodyHtml += `<td style="vertical-align:top; text-align:center; padding: 0 15px; font-size:12pt;">`;
      if (i.avatar) {
        bodyHtml += `<div style="text-align:center; margin-bottom:3px;"><img src="${i.avatar}" width="75" height="98" style="object-fit:cover; border:1px solid #bbb; display:block; margin:0 auto;" /></div>`;
      } else {
        bodyHtml += `<div style="width:75px; height:98px; border:1px dashed #bbb; display:inline-block; line-height:98px; text-align:center; color:#888; font-size:9pt; margin-bottom:3px; background:#fafafa;">Ảnh 3x4</div>`;
      }
      bodyHtml += `<div>Ông <strong>${i.name}</strong></div>`;
      bodyHtml += `<div style="font-size:12pt;">NS: ${fDate(i.ngaySinh)}</div>`;
      bodyHtml += `</td>`;

      if (i.pn1_name && i.pn1_name.trim() !== '') {
        bodyHtml += `<td style="vertical-align:top; text-align:center; padding: 0 15px; font-size:12pt;">`;
        if (i.pn1_avatar) {
          bodyHtml += `<div style="text-align:center; margin-bottom:3px;"><img src="${i.pn1_avatar}" width="75" height="98" style="object-fit:cover; border:1px solid #bbb; display:block; margin:0 auto;" /></div>`;
        } else {
          bodyHtml += `<div style="width:75px; height:98px; border:1px dashed #bbb; display:inline-block; line-height:98px; text-align:center; color:#888; font-size:9pt; margin-bottom:3px; background:#fafafa;">Ảnh 3x4</div>`;
        }
        bodyHtml += `<div>Bà <strong>${i.pn1_name}</strong></div>`;
        bodyHtml += `<div style="font-size:12pt;">NS: ${fDate(i.pn1_ngaySinh)}</div>`;
        bodyHtml += `</td>`;
      }

      bodyHtml += `</tr></table>`;

      bodyHtml += `<div style="font-style:italic; font-size:14pt; margin-bottom:8px; text-align:left;">Vợ chồng sinh hạ được ${X} người con gồm:</div>`;

      children.forEach((c, cIdx) => {
        let spousePart = (c.pn1_name && c.pn1_name.trim() !== '') ? ` và ${c.pn1_name}` : '';
        bodyHtml += `<div style="font-size:12pt; margin-left:20px; margin-bottom:3px; text-align:left;">1.${cIdx + 1}- <b>${c.name}</b>${spousePart} Ngày sinh: ${fDate(c.ngaySinh)}</div>`;
      });

      bodyHtml += renderStrictGridTable(children, 'Con thứ');

      let validChildrenWithGrandKids = children.filter(c => c.children && c.children.length > 0);
      let totalGrandChildren = 0;
      validChildrenWithGrandKids.forEach(c => { totalGrandChildren += c.children.length; });

      if (totalGrandChildren > 0) {
        bodyHtml += `<div style="font-style:italic; font-size:14pt; margin-top:15px; margin-bottom:8px; text-align:left;">${X} người con nói trên sinh hạ được tổng cộng ${totalGrandChildren} người cháu, gồm:</div>`;
        
        validChildrenWithGrandKids.forEach((c, cIdx) => {
          let gChildren = c.children || [];
          let spouseText = (c.pn1_name && c.pn1_name.trim() !== '') ? ` và ${c.pn1_name}` : '';
          bodyHtml += `<div style="font-size:12pt; font-weight:normal; margin-top:10px; margin-bottom:6px; text-align:left;">${cIdx + 1}- <b>${c.name}</b>${spouseText} sinh hạ được ${gChildren.length} con:</div>`;
          
          gChildren.forEach((gc, gcIdx) => {
            let gcSpouse = (gc.pn1_name && gc.pn1_name.trim() !== '') ? ` và ${gc.pn1_name}` : '';
            bodyHtml += `<div style="font-size:11pt; margin-left:25px; margin-bottom:3px; text-align:left;">${cIdx + 1}.${gcIdx + 1}- <b>${gc.name}</b>${gcSpouse} Ngày sinh: ${fDate(gc.ngaySinh)}</div>`;
          });

          bodyHtml += renderStrictGridTable(gChildren, 'Cháu');
        });

        let validGrandKidsWithGreatGrandKids = [];
        let totalGreatGrandChildren = 0;

        validChildrenWithGrandKids.forEach(c => {
          (c.children || []).forEach(gc => {
            if (gc.children && gc.children.length > 0) {
              validGrandKidsWithGreatGrandKids.push(gc);
              totalGreatGrandChildren += gc.children.length;
            }
          });
        });

        if (totalGreatGrandChildren > 0) {
          bodyHtml += `<div style="font-style:italic; font-size:14pt; margin-top:18px; margin-bottom:8px; text-align:left;">${totalGrandChildren} người cháu nói trên sinh hạ được tổng cộng ${totalGreatGrandChildren} người chắt, gồm:</div>`;

          validGrandKidsWithGreatGrandKids.forEach((gc, gcIdx) => {
            let ggChildren = gc.children || [];
            let spouseText = (gc.pn1_name && gc.pn1_name.trim() !== '') ? ` và ${gc.pn1_name}` : '';
            
            bodyHtml += `<div style="font-size:12pt; font-weight:normal; margin-top:10px; margin-bottom:6px; text-align:left;">${gcIdx + 1}- <b>${gc.name}</b>${spouseText} sinh hạ được ${ggChildren.length} con:</div>`;
            
            ggChildren.forEach((ggc, ggcIdx) => {
              let ggcSpouse = (ggc.pn1_name && ggc.pn1_name.trim() !== '') ? ` và ${ggc.pn1_name}` : '';
              bodyHtml += `<div style="font-size:11pt; margin-left:25px; margin-bottom:3px; text-align:left;">${gcIdx + 1}.${ggcIdx + 1}- <b>${ggc.name}</b>${ggcSpouse} Ngày sinh: ${fDate(ggc.ngaySinh)}</div>`;
            });

            bodyHtml += renderStrictGridTable(ggChildren, 'Chắt thứ');
          });
        }
      }
    } 
    else if (subType === 'branch') {
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:14pt; text-transform:uppercase; margin-bottom:4px;">GIA PHẢ DÒNG TỘC HỌ HOÀNG</div>`;
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:13pt; text-transform:uppercase; margin-bottom:10px;">NHÁNH THỨ ${targetBranch}</div>`;
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; text-transform:uppercase; margin-bottom:4px;">ĐỜI THỨ NHẤT</div>`;
      
      let branchHead = sortedList.find(n => (n.nhanhThu || 1) === targetBranch && n.doi === 1) || sortedList[0];
      let sttHead = getStt(branchHead);
      
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:2px;">${sttHead}Ông: ${branchHead.name}, Sinh ngày: ${fDate(branchHead.ngaySinh)}</div>`;
      if (branchHead.pn1_name && branchHead.pn1_name.trim() !== '') {
        bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:4px;">Bà: ${branchHead.pn1_name}, Sinh ngày: ${fDate(branchHead.pn1_ngaySinh)}</div>`;
      }
      if (branchHead.pn2_name && branchHead.pn2_name.trim() !== '') {
        bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:6px;">Bà: ${branchHead.pn2_name}, Sinh ngày: ${fDate(branchHead.pn2_ngaySinh)}</div>`;
      }

      let branchMembers = sortedList.filter(n => (n.nhanhThu || 1) === targetBranch && n.doi > 1);
      let maxBranchDoi = branchMembers.reduce((max, n) => Math.max(max, n.doi), 1);

      for (let d = 2; d <= maxBranchDoi; d++) {
        let doiText = d === 2 ? "ĐỜI THỨ HAI" : `ĐỜI THỨ ${d}`;
        bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; text-transform:uppercase; margin-top:10px; margin-bottom:4px;">${doiText}</div>`;

        let parentsAtDoi = [];
        const collectBranchParents = (nodes) => {
          nodes.forEach(n => {
            if ((n.nhanhThu || 1) === targetBranch && n.doi === d - 1 && isMale(n) && n.children && n.children.length > 0) {
              parentsAtDoi.push(n);
            }
            if (n.children) collectBranchParents(n.children);
          });
        };
        collectBranchParents(treeData);

        parentsAtDoi.forEach(parent => {
          let allChildren = (parent.children || []).filter(c => (c.nhanhThu || 1) === targetBranch);
          if (allChildren.length > 0) {
            let parentStt = getStt(parent);

            let childrenPn1 = allChildren.filter(c => c.conBaName === parent.pn1_name || (!c.conBaName && parent.pn1_name));
            if (childrenPn1.length === 0 && !parent.pn2_name) {
              childrenPn1 = allChildren;
            }
            let childrenPn2 = allChildren.filter(c => c.conBaName === parent.pn2_name);

            if (parent.pn1_name && parent.pn1_name.trim() !== '') {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:2px;">${parentStt} Ông:${parent.name} và bà:${parent.pn1_name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">sinh hạ được ${childrenPn1.length} người con gồm:</div>`;
              
              childrenPn1.forEach((c) => {
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${getStt(c)}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }

            if (parent.pn2_name && parent.pn2_name.trim() !== '' && childrenPn2.length > 0) {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-top:6px; margin-bottom:2px;">${parentStt} Ông:${parent.name} và bà:${parent.pn2_name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">sinh hạ được ${childrenPn2.length} người con gồm:</div>`;
              
              childrenPn2.forEach((c) => {
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${getStt(c)}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }

            if (!parent.pn1_name && !parent.pn2_name) {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:2px;">${parentStt} ${parent.name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">sinh hạ được ${allChildren.length} người con gồm:</div>`;
              allChildren.forEach((c) => {
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${getStt(c)}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }
          }
        });
      }
    }
    else if (type === 'ho') {
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:14pt; text-transform:uppercase; margin-bottom:10px;">GIA PHẢ DÒNG TỘC HỌ HOÀNG</div>`;
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; text-transform:uppercase; margin-bottom:4px;">ĐỜI THỨ NHẤT</div>`;
      
      const doi1Members = sortedList.filter(i => i.doi === 1);
      doi1Members.forEach(item => {
        let sttItem = getStt(item);
        let spouseItem = (item.pn1_name && item.pn1_name.trim() !== '') ? `, vợ là ${item.pn1_name}, Sinh ngày: ${fDate(item.pn1_ngaySinh)}` : '';
        bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:4px;">${sttItem}Ông: ${item.name}, Sinh ngày: ${fDate(item.ngaySinh)}${spouseItem}</div>`;
      });

      for (let d = 2; d <= maxDoi; d++) {
        let doiText = d === 2 ? "ĐỜI THỨ HAI" : `ĐỜI THỨ ${d}`;
        bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:12pt; text-transform:uppercase; margin-top:10px; margin-bottom:4px;">${doiText}</div>`;
        
        let parentsAtDoiMinus1 = [];
        const collectParents = (nodes) => {
          nodes.forEach(n => {
            if (n.doi === d - 1 && isMale(n) && n.children && n.children.length > 0) {
              parentsAtDoiMinus1.push(n);
            }
            if (n.children) collectParents(n.children);
          });
        };
        collectParents(treeData);

        parentsAtDoiMinus1.forEach(parent => {
          let allChildren = parent.children || [];
          if (allChildren.length > 0) {
            let sttParent = getStt(parent);

            let childrenPn1 = allChildren.filter(c => c.conBaName === parent.pn1_name || (!c.conBaName && parent.pn1_name));
            if (childrenPn1.length === 0 && !parent.pn2_name) {
              childrenPn1 = allChildren;
            }
            let childrenPn2 = allChildren.filter(c => c.conBaName === parent.pn2_name);

            if (parent.pn1_name && parent.pn1_name.trim() !== '') {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:2px;">${sttParent} Ông:${parent.name} và bà:${parent.pn1_name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">Sinh hạ được ${childrenPn1.length} người con gồm:</div>`;
              
              childrenPn1.forEach((c) => {
                let sttC = getStt(c);
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${sttC}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }

            if (parent.pn2_name && parent.pn2_name.trim() !== '' && childrenPn2.length > 0) {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-top:6px; margin-bottom:2px;">${sttParent} Ông:${parent.name} và bà:${parent.pn2_name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">Sinh hạ được ${childrenPn2.length} người con gồm:</div>`;
              
              childrenPn2.forEach((c) => {
                let sttC = getStt(c);
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${sttC}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }

            if (!parent.pn1_name && !parent.pn2_name) {
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:2px;">${sttParent} ${parent.name}</div>`;
              bodyHtml += `<div style="text-align:center; font-style:italic; font-size:12pt; margin-bottom:4px;">Sinh hạ được ${allChildren.length} người con gồm:</div>`;
              allChildren.forEach((c) => {
                let sttC = getStt(c);
                let dxC = getDx(isMale(c));
                let spousePartC = (c.pn1_name && c.pn1_name.trim() !== '') ? ` ${dxC} ${c.pn1_name}, sinh ngày:${fDate(c.pn1_ngaySinh)}` : '';
                bodyHtml += `<div style="font-size:11pt; margin-left:20px; margin-bottom:2px; text-align:left;">${sttC}${c.name}, sinh ngày:${fDate(c.ngaySinh)} ${spousePartC}</div>`;
              });
            }
          }
        });
      }
    }
    else if (type === 'tree') {
      bodyHtml += `<div style="text-align:center; font-weight:bold; font-size:14pt; text-transform:uppercase; margin-bottom:12px; font-family:'Times New Roman', Times, serif;">CÂY THƯ MỤC GIA PHẢ HỌ HOÀNG (TỪ ĐỜI 1 ĐẾN ĐỜI ${maxDoi})</div>`;
      
      bodyHtml += `<table border="0" cellspacing="0" cellpadding="0" style="font-family:'Times New Roman', Times, serif; font-size:13pt; border-collapse:collapse; width:100%; line-height:1.2;">`;
      
      const renderTreeTableRows = (nodes, prefix = '', level = 0) => {
        nodes.forEach((n, index) => {
          let isLast = index === nodes.length - 1;
          let color = getGenerationColor(n.doi || 1);
          
          let branchStr = '';
          if (level > 0) {
            branchStr = prefix + (isLast ? '└── ' : '├── ');
          }
          
          bodyHtml += `<tr style="height: 20px;">`;
          bodyHtml += `<td style="font-family:'Courier New', Courier, monospace; font-size: 12pt; white-space: pre; line-height: 1.0; padding: 0; text-align: left;">`;
          if (level > 0) {
            let ancestorLines = branchStr.slice(0, -4);
            let pointerPart = branchStr.slice(-4);
            bodyHtml += `<span style="color: #444444;">${ancestorLines}</span>`;
            bodyHtml += `<span style="color: #000000; font-weight: bold;">${pointerPart}</span>`;
          }
          bodyHtml += `<span style="color: ${color}; font-family:'Times New Roman', Times, serif;"><b>Đời ${n.doi}:</b> ${n.name} (Con thứ: ${n.conThu || 1})</span>`;
          bodyHtml += `</td>`;
          bodyHtml += `</tr>`;
          
          if (n.children && n.children.length > 0) {
            let newPrefix = prefix + (isLast ? '    ' : '│   ');
            renderTreeTableRows(n.children, newPrefix, level + 1);
          }
        });
      };

      renderTreeTableRows(treeData, '', 0);
      bodyHtml += `</table>`;
    }

    return bodyHtml;
  };

  const executeExportWord = (type, subType = '') => {
    try {
      let member = targetMember || selectedMember;
      let cleanMemberName = (member?.name || 'ThanhVien').replace(/[^a-zA-Z0-9àáạảãâấầậẩẫăắằặẳẵèéẹẻẽêếềệểễìíịỉĩòóọỏõôốồộổỗơớờợởỡùúụủũưứừựửữỳýỵỷỹđĐ\s]/g, '').trim().replace(/\s+/g, '_');
      let fileName = '';

      if (type === 'single') fileName = `GiaPha_${cleanMemberName}_${dayjs().format('YYYYMMDD_HHmmss')}.doc`;
      else if (type === 'family') fileName = `GiaPha_family_${cleanMemberName}_${dayjs().format('YYYYMMDD_HHmmss')}.doc`;
      else if (subType === 'branch') fileName = `GiaPha_Nhanh_${targetBranch}_${dayjs().format('YYYYMMDD_HHmmss')}.doc`;
      else if (type === 'ho') fileName = `GiaPha_ToanHo_${dayjs().format('YYYYMMDD_HHmmss')}.doc`;
      else if (type === 'tree') fileName = `GiaPha_SoDoCay_${dayjs().format('YYYYMMDD_HHmmss')}.doc`;

      const bodyHtml = generateContentHtml(type, subType);

      const fullHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/1999/xhtml'>
        <head><meta charset='utf-8'><title>Gia Phả</title></head>
        <body style="font-family: 'Times New Roman', Times, serif; font-size: 12pt;">
          ${bodyHtml}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + fullHtml], { type: "application/msword;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      message.success(`Kết xuất file "${fileName}" thành công!`);
      setIsModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi kết xuất file Word!');
    }
  };

  const wordMenuProps = {
    items: [
      { key: 'single', label: '1. Hồ sơ cá nhân' },
      { key: 'family', label: '2. Gia phả Gia đình' },
      {
        key: 'ho_sub',
        label: '3. Gia phả dòng họ',
        children: [
          { key: 'branch', label: 'a. Gia phả nhánh' },
          { key: 'ho', label: 'b. Gia phả Họ (Bình thường)' },
          { key: 'tree', label: 'c. Gia phả Họ (Sơ đồ cây)' },
        ],
      },
    ],
    onClick: (e) => {
      if (e.key === 'single') { setModalType('single'); setIsModalVisible(true); }
      else if (e.key === 'family') { setModalType('family'); setIsModalVisible(true); }
      else if (e.key === 'branch') { setModalType('branch'); setIsModalVisible(true); }
      else if (e.key === 'ho') { executeExportWord('ho'); }
      else if (e.key === 'tree') { executeExportWord('tree'); }
    },
  };

  const handleViewOptionClick = (type, subType = '') => {
    if (type === 'single' || type === 'family' || subType === 'branch') {
      setViewModalType(subType || type);
      setIsViewSelectorModalVisible(true);
    } else {
      const html = generateContentHtml(type, subType);
      setViewHtmlContent(html);
      setIsViewModalVisible(true);
    }
  };

  const viewMenuProps = {
    items: [
      { key: 'single', label: 'Xem hồ sơ cá nhân' },
      { key: 'family', label: 'Xem Gia phả gia đình' },
      { key: 'branch', label: 'Xem Gia phả các nhánh' },
      { key: 'ho', label: 'Xem Gia phả dòng họ' },
      { key: 'tree', label: 'Xem Gia phả theo dạng cây' },
    ],
    onClick: (e) => {
      if (e.key === 'single') handleViewOptionClick('single');
      else if (e.key === 'family') handleViewOptionClick('family');
      else if (e.key === 'branch') handleViewOptionClick('branch', 'branch');
      else if (e.key === 'ho') handleViewOptionClick('ho');
      else if (e.key === 'tree') handleViewOptionClick('tree');
    },
  };

  const tableColumns = [
    { title: 'Họ và Tên', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Đời', dataIndex: 'doi', key: 'doi', align: 'center', render: (v) => <Tag color="blue">Đời {v}</Tag> },
    { title: 'Nhánh', dataIndex: 'nhanhThu', key: 'nhanhThu', align: 'center', render: (v) => <Tag color="orange">Nhánh {v}</Tag> },
    { title: 'Con', dataIndex: 'conThu', key: 'conThu', align: 'center', render: (v) => <Tag color="green">Con {v}</Tag> }
  ];

  const filteredData = sortedList.filter(item => item?.name?.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <ConfigProvider locale={viVN}>
    <div className="min-h-screen bg-slate-100 p-1 text-xs">
      <style>{`
        .ant-form-item {
          margin-bottom: 4px !important;
        }
        .ant-form-item-label {
          padding-bottom: 0px !important;
          padding-top: 0px !important;
        }
        .ant-card-body {
          padding: 6px !important;
        }
        .ant-card-head {
          min-height: 32px !important;
          padding: 0 8px !important;
        }
        .ant-divider {
          margin: 6px 0 !important;
        }
      `}</style>

      <div className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-sm mb-1">
        <Title level={4} className="m-0 text-blue-900 flex items-center gap-2">
          <ApartmentOutlined />           QUẢN LÝ GIA PHẢ DÒNG TỘC (TRỰC TUYẾN)
        </Title>
        <Space wrap size={4}>
          <Button icon={<DownloadOutlined />} size="small" onClick={handleExportJSON} className="border-green-600 text-green-700 font-medium">
            Sao lưu dữ liệu
          </Button>
          <label className="ant-btn ant-btn-sm ant-btn-default border-blue-600 text-blue-700 font-medium cursor-pointer flex items-center gap-1 px-2 py-1 rounded bg-white shadow-sm hover:bg-blue-50">
            <UploadOutlined /> Phục hồi dữ liệu
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>

          <Dropdown menu={viewMenuProps} placement="bottomRight">
            <Button type="default" size="small" icon={<EyeOutlined />} className="border-purple-600 text-purple-700 font-medium">
              Xem <DownOutlined />
            </Button>
          </Dropdown>

          <Dropdown menu={wordMenuProps} placement="bottomRight">
            <Button type="primary" size="small" className="bg-blue-600">
              Xuất ra file Word <DownOutlined />
            </Button>
          </Dropdown>

          {user ? (
            <Button type="dashed" size="small" danger onClick={handleLogout}>
              Đăng xuất ({user.email})
            </Button>
          ) : (
            <Button type="default" size="small" onClick={() => setLoginModalVisible(true)} className="border-orange-500 text-orange-600 font-medium">
              Đăng nhập Quản trị
            </Button>
          )}
        </Space>
      </div>

      {/* Modal Đăng nhập Quản trị viên */}
      <Modal
        title="Đăng nhập tài khoản Quản trị viên"
        open={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
        footer={null}
      >
        <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
          <Form.Item name="email" label="Email quản trị" rules={[{ required: true, message: 'Vui lòng nhập email!' }]}>
            <Input placeholder="admin@gmail.com" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
            <Input.Password placeholder="Mật khẩu..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block className="bg-blue-600 mt-2">
            Xác nhận đăng nhập
          </Button>
        </Form>
      </Modal>

      <Modal
        title={modalType === 'branch' ? 'Chọn Nhánh để xuất gia phả' : modalType === 'family' ? 'Chọn Thành viên đại diện gia đình' : 'Chọn Thành viên xuất hồ sơ'}
        open={isModalVisible}
        onOk={() => {
          if (modalType === 'branch') executeExportWord('branch', 'branch');
          else if (modalType === 'family') executeExportWord('family');
          else executeExportWord('single');
        }}
        onCancel={() => setIsModalVisible(false)}
        okText="Xác nhận xuất Word"
        cancelText="Hủy"
      >
        {modalType === 'branch' ? (
          <div className="py-2">
            <p>Nhập hoặc chọn số thứ tự nhánh:</p>
            <InputNumber min={1} value={targetBranch} onChange={(v) => setTargetBranch(v)} className="w-full" />
          </div>
        ) : (
          <div className="py-2 max-h-60 overflow-y-auto">
            <List
              size="small"
              bordered
              dataSource={sortedList}
              renderItem={(item) => (
                <List.Item
                  className={`cursor-pointer ${targetMember?.key === item.key ? 'bg-blue-100 font-bold' : ''}`}
                  onClick={() => setTargetMember(item)}
                >
                  {item.name} (Đời {item.doi} - Nhánh {item.nhanhThu})
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={viewModalType === 'branch' ? 'Chọn Nhánh để xem gia phả' : viewModalType === 'family' ? 'Chọn Thành viên đại diện gia đình để xem' : 'Chọn Thành viên để xem hồ sơ'}
        open={isViewSelectorModalVisible}
        onOk={() => {
          setIsViewSelectorModalVisible(false);
          let html = '';
          if (viewModalType === 'branch') html = generateContentHtml('branch', 'branch');
          else if (viewModalType === 'family') html = generateContentHtml('family');
          else html = generateContentHtml('single');
          setViewHtmlContent(html);
          setIsViewModalVisible(true);
        }}
        onCancel={() => setIsViewSelectorModalVisible(false)}
        okText="Xác nhận xem"
        cancelText="Hủy"
      >
        {viewModalType === 'branch' ? (
          <div className="py-2">
            <p>Nhập hoặc chọn số thứ tự nhánh cần xem:</p>
            <InputNumber min={1} value={targetBranch} onChange={(v) => setTargetBranch(v)} className="w-full" />
          </div>
        ) : (
          <div className="py-2 max-h-60 overflow-y-auto">
            <List
              size="small"
              bordered
              dataSource={sortedList}
              renderItem={(item) => (
                <List.Item
                  className={`cursor-pointer ${targetMember?.key === item.key ? 'bg-purple-100 font-bold' : ''}`}
                  onClick={() => setTargetMember(item)}
                >
                  {item.name} (Đời {item.doi} - Nhánh {item.nhanhThu})
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Xem Nội Dung Gia Phả Trực Tuyến"
        open={isViewModalVisible}
        onCancel={() => { setIsViewModalVisible(false); setViewHtmlContent(''); }}
        footer={[
          <Button key="close" type="primary" onClick={() => { setIsViewModalVisible(false); setViewHtmlContent(''); }}>
            Đóng lại
          </Button>
        ]}
        width={900}
      >
        <div 
          className="max-h-[75vh] overflow-y-auto p-4 bg-white border rounded shadow-inner"
          dangerouslySetInnerHTML={{ __html: viewHtmlContent }}
        />
      </Modal>

      <Row gutter={4}>
        {/* CỘT 1: THÊM THÀNH VIÊN MỚI (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP ĐÚNG TÀI KHOẢN ADMIN) */}
        <Col span={8}>
          {isAdmin ? (
            <Card title="1. Thêm Thành Viên Mới" size="small" className="shadow-sm">
              <Form 
                form={addForm} 
                layout="vertical" 
                onFinish={onFinishAdd} 
                initialValues={{ conThu: 1, nhanhThu: 0, gioiTinh: 'nam' }} 
              >
                <Form.Item 
                  name="parentKey" 
                  label={<span className="font-semibold text-gray-700">Họ tên cha:</span>} 
                  rules={[{ required: true, message: 'Vui lòng chọn Cha tiền bối' }]}
                >
                  <Select
                    size="small"
                    placeholder="Chọn người sinh thành..."
                    onChange={handleParentChange}
                    options={sortedList.map(item => ({ label: `${item.name} (Đời ${item.doi} - Nhánh ${item.nhanhThu})`, value: item.key }))}
                  />
                </Form.Item>

                <Row gutter={2}>
                  <Col span={12}>
                    <Form.Item name="name" label={<span className="font-semibold text-gray-700">Họ và tên</span>} rules={[{ required: true, message: 'Nhập họ tên' }]}>
                      <Input size="small" placeholder="Tên thành viên..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ngaySinh" label={<span className="font-semibold text-gray-700">Ngày sinh</span>}>
                      <DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={2}>
                  <Col span={12}>
                    <Form.Item name="gioiTinh" label="Giới tính">
                      <Select size="small" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="doi" label="Đời thứ"><InputNumber size="small" className="w-full" /></Form.Item>
                  </Col>
                </Row>

                <Row gutter={2}>
                  <Col span={12}>
                    <Form.Item name="nhanhThu" label="Nhánh thứ"><InputNumber size="small" className="w-full" min={0} /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="conThu" label="Con thứ"><InputNumber size="small" className="w-full" min={1} /></Form.Item>
                  </Col>
                </Row>

                <Row gutter={2}>
                  <Col span={12}>
                    <Form.Item name="conOngName" label="Con ông"><Input size="small" /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="conOngNgaySinh" label="NS Cha"><Input size="small" placeholder="Ngày/Tháng/Năm" /></Form.Item>
                  </Col>
                </Row>

                <Row gutter={2}>
                  <Col span={12}>
                    <Form.Item name="conBaName" label="Con bà"><Input size="small" /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="conBaNgaySinh" label="NS Mẹ"><Input size="small" placeholder="Ngày/Tháng/Năm" /></Form.Item>
                  </Col>
                </Row>

                <Form.Item name="tieuSu" label="Tiểu sử cá nhân (dùng dấu gạch ngang - để ngắt dòng)">
                  <TextArea rows={2} size="small" placeholder="- Tiểu sử dòng 1&#10;- Tiểu sử dòng 2" />
                </Form.Item>

                <Form.Item label="Nhập ảnh cá nhân">
                  <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => addForm.setFieldsValue({ avatar: url }))} />
                  <Form.Item name="avatar" noStyle><Input type="hidden" /></Form.Item>
                </Form.Item>

                <Tabs size="small" type="card" className="mt-0.5" items={[
                  {
                    key: 'pn1', label: 'Phối Ngẫu 1', children: (
                      <div className="bg-slate-50 p-1 border rounded">
                        <Form.Item name="pn1_name" label={<span className="text-[11px] leading-tight text-gray-600">Tên PN 1</span>}><Input size="small" /></Form.Item>
                        <Form.Item name="pn1_ngaySinh" label={<span className="text-[11px] leading-tight text-gray-600">Ngày Sinh PN 1</span>}><DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" /></Form.Item>
                        <Form.Item name="pn1_gioiTinh" label={<span className="text-[11px] leading-tight text-gray-600">Giới Tính PN 1</span>}>
                          <Select size="small" defaultValue="nu" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                        </Form.Item>
                        <Form.Item name="pn1_tieuSu" label={<span className="text-[11px] leading-tight text-gray-600">Tiểu Sử PN 1 (dùng dấu -)</span>}><TextArea rows={2} size="small" placeholder="- Tiểu sử vợ/chồng" /></Form.Item>
                        
                        <div className="flex justify-center my-0.5">
                          <Avatar size={50} src={addPn1Avatar} icon={<UserOutlined />} className="shadow border" />
                        </div>

                        <Form.Item label={<span className="text-[11px] leading-tight text-gray-600">Nhập ảnh cá nhân PN 1</span>} className="!mb-0">
                          <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { addForm.setFieldsValue({ pn1_avatar: url }); setAddPn1Avatar(url); })} />
                          <Form.Item name="pn1_avatar" noStyle><Input type="hidden" /></Form.Item>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'pn2', label: 'Phối Ngẫu 2', children: (
                      <div className="bg-slate-50 p-1 border rounded">
                        <Form.Item name="pn2_name" label={<span className="text-[11px] leading-tight text-gray-600">Tên PN 2</span>}><Input size="small" /></Form.Item>
                        <Form.Item name="pn2_ngaySinh" label={<span className="text-[11px] leading-tight text-gray-600">Ngày Sinh PN 2</span>}><DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" /></Form.Item>
                        <Form.Item name="pn2_gioiTinh" label={<span className="text-[11px] leading-tight text-gray-600">Giới Tính PN 2</span>}>
                          <Select size="small" defaultValue="nu" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                        </Form.Item>
                        <Form.Item name="pn2_tieuSu" label={<span className="text-[11px] leading-tight text-gray-600">Tiểu Sử PN 2 (dùng dấu -)</span>}><TextArea rows={2} size="small" placeholder="- Tiểu sử vợ 2" /></Form.Item>
                        
                        <div className="flex justify-center my-0.5">
                          <Avatar size={50} src={addPn2Avatar} icon={<UserOutlined />} className="shadow border" />
                        </div>

                        <Form.Item label={<span className="text-[11px] leading-tight text-gray-600">Nhập ảnh cá nhân PN 2</span>} className="!mb-0">
                          <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { addForm.setFieldsValue({ pn2_avatar: url }); setAddPn2Avatar(url); })} />
                          <Form.Item name="pn2_avatar" noStyle><Input type="hidden" /></Form.Item>
                        </Form.Item>
                      </div>
                    )
                  }
                ]} />

                <Divider />

                <div className="flex gap-1.5">
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="small" className="bg-blue-600">
                    Cập nhật trực tuyến
                  </Button>
                  <Button icon={<CloseOutlined />} block size="small" onClick={handleCancelAdd}>
                    Bỏ qua
                  </Button>
                </div>
              </Form>
            </Card>
          ) : (
            <Card title="1. Thêm Thành Viên Mới" size="small" className="shadow-sm">
              <div className="py-12 text-center px-2">
                <Text type="secondary">Chức năng thêm thành viên chỉ dành cho Quản trị viên dòng họ. Vui lòng bấm <b className="text-orange-600">Đăng nhập Quản trị</b> ở góc trên bên phải để thao tác.</Text>
              </div>
            </Card>
          )}
        </Col>

        {/* CỘT 2: SƠ ĐỒ CẤU TRÚC DÒNG HỌ (TẤT CẢ CÁC USER ĐỀU XEM ĐƯỢC) */}
        <Col span={8}>
          <Card title="2. Sơ Đồ Cấu Trúc Dòng Họ" size="small" className="shadow-sm">
            <Input
              size="small"
              placeholder="Tìm kiếm theo tên..."
              prefix={<SearchOutlined />}
              className="mb-1"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <Table
              dataSource={filteredData}
              columns={tableColumns}
              size="small"
              pagination={false}
              rowKey="key"
              onRow={(record) => ({
                onClick: () => setSelectedKey(record.key),
                className: record.key === selectedKey ? 'bg-blue-100 cursor-pointer font-bold' : 'cursor-pointer'
              })}
              scroll={{ x: true, y: 520 }}
            />
          </Card>
        </Col>

        {/* CỘT 3: ĐIỀU CHỈNH THÔNG TIN CHI TIẾT (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP ĐÚNG TÀI KHOẢN ADMIN) */}
        <Col span={8}>
          {isAdmin ? (
            <Card title="3. Điều Chỉnh Thông Tin Chi Tiết" size="small" className="shadow-sm border-t-4 border-t-blue-600">
              {selectedMember ? (
                <Form 
                  form={editForm} 
                  layout="vertical" 
                  onFinish={onFinishEdit} 
                >
                  <div className="flex justify-center my-0.5">
                    <Avatar size={60} src={selectedMember.avatar} icon={<UserOutlined />} className="shadow border" />
                  </div>

                  <Row gutter={2}>
                    <Col span={12}>
                      <Form.Item name="name" label={<span className="font-semibold text-gray-700">Họ và tên</span>} rules={[{ required: true }]}>
                        <Input size="small" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="ngaySinh" label={<span className="font-semibold text-gray-700">Ngày sinh</span>}>
                        <DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={2}>
                    <Col span={12}>
                      <Form.Item name="gioiTinh" label="Giới tính">
                        <Select size="small" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="doi" label="Đời thứ"><InputNumber size="small" className="w-full" /></Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={2}>
                    <Col span={12}>
                      <Form.Item name="nhanhThu" label="Nhánh thứ"><InputNumber size="small" className="w-full" min={0} /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="conThu" label="Con thứ"><InputNumber size="small" className="w-full" min={1} /></Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={2}>
                    <Col span={12}>
                      <Form.Item name="conOngName" label="Con ông"><Input size="small" /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="conOngNgaySinh" label="NS Cha"><Input size="small" /></Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={2}>
                    <Col span={12}>
                      <Form.Item name="conBaName" label="Con bà"><Input size="small" /></Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="conBaNgaySinh" label="NS Mẹ"><Input size="small" /></Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="tieuSu" label="Tiểu sử cá nhân (dùng dấu -)">
                    <TextArea rows={2} size="small" />
                  </Form.Item>

                  <Form.Item label="Đổi ảnh cá nhân">
                    <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => editForm.setFieldsValue({ avatar: url }))} />
                    <Form.Item name="avatar" noStyle><Input type="hidden" /></Form.Item>
                  </Form.Item>

                  <Tabs size="small" type="card" className="mt-0.5" items={[
                    {
                      key: 'edit_pn1', label: 'Phối Ngẫu 1', children: (
                        <div className="bg-slate-50 p-1 border rounded">
                          <Form.Item name="pn1_name" label={<span className="text-[11px] leading-tight text-gray-600">Tên PN 1</span>}><Input size="small" /></Form.Item>
                          <Form.Item name="pn1_ngaySinh" label={<span className="text-[11px] leading-tight text-gray-600">Ngày sinh PN 1</span>}><DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" /></Form.Item>
                          <Form.Item name="pn1_gioiTinh" label={<span className="text-[11px] leading-tight text-gray-600">Giới Tính PN 1</span>}>
                            <Select size="small" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                          </Form.Item>
                          <Form.Item name="pn1_tieuSu" label={<span className="text-[11px] leading-tight text-gray-600">Tiểu sử PN 1 (dùng dấu -)</span>}><TextArea rows={2} size="small" /></Form.Item>
                          
                          <div className="flex justify-center my-0.5">
                            <Avatar size={50} src={editPn1Avatar} icon={<UserOutlined />} className="shadow border" />
                          </div>

                          <Form.Item label={<span className="text-[11px] leading-tight text-gray-600">Đổi ảnh cá nhân PN 1</span>} className="!mb-0">
                            <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { editForm.setFieldsValue({ pn1_avatar: url }); setEditPn1Avatar(url); })} />
                            <Form.Item name="pn1_avatar" noStyle><Input type="hidden" /></Form.Item>
                          </Form.Item>
                        </div>
                      )
                    },
                    {
                      key: 'edit_pn2', label: 'Phối Ngẫu 2', children: (
                        <div className="bg-slate-50 p-1 border rounded">
                          <Form.Item name="pn2_name" label={<span className="text-[11px] leading-tight text-gray-600">Tên PN 2</span>}><Input size="small" /></Form.Item>
                          <Form.Item name="pn2_ngaySinh" label={<span className="text-[11px] leading-tight text-gray-600">Ngày sinh PN 2</span>}><DatePicker size="small" format="DD/MM/YYYY" placeholder="Ngày/Tháng/Năm" className="w-full" /></Form.Item>
                          <Form.Item name="pn2_gioiTinh" label={<span className="text-[11px] leading-tight text-gray-600">Giới Tính PN 2</span>}>
                            <Select size="small" options={[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }]} />
                          </Form.Item>
                          <Form.Item name="pn2_tieuSu" label={<span className="text-[11px] leading-tight text-gray-600">Tiểu sử PN 2 (dùng dấu -)</span>}><TextArea rows={2} size="small" /></Form.Item>
                          
                          <div className="flex justify-center my-0.5">
                            <Avatar size={50} src={editPn2Avatar} icon={<UserOutlined />} className="shadow border" />
                          </div>

                          <Form.Item label={<span className="text-[11px] leading-tight text-gray-600">Đổi ảnh cá nhân PN 2</span>} className="!mb-0">
                            <input type="file" accept="image/*" className="text-xs w-full border rounded p-0.5 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { editForm.setFieldsValue({ pn2_avatar: url }); setEditPn2Avatar(url); })} />
                            <Form.Item name="pn2_avatar" noStyle><Input type="hidden" /></Form.Item>
                          </Form.Item>
                        </div>
                      )
                    }
                  ]} />

                  <Divider />

                  <div className="flex gap-1.5">
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="small" className="bg-blue-600 flex-1">
                      Cập nhật trực tuyến
                    </Button>
                    <Button icon={<CloseOutlined />} size="small" onClick={handleCancelEdit} className="flex-1">
                      Bỏ qua
                    </Button>
                    <Button danger icon={<DeleteOutlined />} size="small" onClick={handleDeleteMember}>
                      Xoá
                    </Button>
                  </div>
                </Form>
              ) : (
                <Text className="text-gray-400">Vui lòng chọn 1 thành viên từ danh sách bên trái để điều chỉnh.</Text>
              )}
            </Card>
          ) : (
            <Card title="3. Điều Chỉnh Thông Tin Chi Tiết" size="small" className="shadow-sm border-t-4 border-t-orange-500">
              <div className="py-12 text-center px-2">
                <Text type="secondary">Chức năng chỉnh sửa thông tin chi tiết chỉ dành cho Quản trị viên dòng họ. Vui lòng đăng nhập để thao tác.</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
    </ConfigProvider>
  );
}