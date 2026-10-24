import React, { useState, useEffect } from 'react';
import {
  Button, Input, Card, Form, Select, DatePicker, Row, Col, Table, Tag, Space, Divider,
  Typography, message, InputNumber, Avatar, Tabs, Modal
} from 'antd';
import {
  ApartmentOutlined, UserOutlined, SaveOutlined, CloseOutlined, SearchOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

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
    avatar: "",
    parentKey: "",
    conOngName: "",
    conBaName: "",
    tieuSu: "Người đặt nền móng dòng họ.",
    pn1_name: "Lê Thị Bần",
    pn1_ngaySinh: "1922-05-10",
    pn1_avatar: "",
    pn1_tieuSu: "Vợ cả",
    pn2_name: "",
    pn2_ngaySinh: "",
    pn2_avatar: "",
    pn2_tieuSu: "",
    children: []
  }
];

export default function App() {
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [treeData, setTreeData] = useState(() => {
    const saved = localStorage.getItem('GIA_PHA_PRO_DATA');
    return saved ? JSON.parse(saved) : defaultData;
  });

  const [selectedKey, setSelectedKey] = useState("1");
  const [searchText, setSearchText] = useState("");

  const [addPn1Avatar, setAddPn1Avatar] = useState("");
  const [addPn2Avatar, setAddPn2Avatar] = useState("");
  const [editPn1Avatar, setEditPn1Avatar] = useState("");
  const [editPn2Avatar, setEditPn2Avatar] = useState("");

  const findNode = (nodes, key) => {
    for (let n of nodes) {
      if (n.key === key) return n;
      if (n.children?.length > 0) {
        const f = findNode(n.children, key);
        if (f) return f;
      }
    }
    return null;
  };

  // Thuật toán duyệt cây chuẩn phả hệ theo chiều rộng (BFS) hoặc theo thứ tự cha sinh trước
  const getGenealogySortedList = (nodes) => {
    let result = [];
    let queue = [...nodes];
    
    // Đảm bảo đưa đời 1 lên đầu tiên
    while (queue.length > 0) {
      let current = queue.shift();
      result.push(current);
      if (current.children && current.children.length > 0) {
        // Sắp xếp các con theo con thứ từ 1 đến n trước khi đưa vào hàng đợi
        let sortedChildren = [...current.children].sort((a, b) => (a.conThu || 1) - (b.conThu || 1));
        queue.push(...sortedChildren);
      }
    }

    // Sắp xếp toàn bộ danh sách theo: Đời -> Thứ tự xuất hiện của Cha (dòng trưởng/thứ) -> Con thứ
    let maxDoi = result.reduce((max, n) => Math.max(max, n.doi || 1), 1);
    let finalSorted = [];

    for (let d = 1; d <= maxDoi; d++) {
      let membersInDoi = result.filter(n => (n.doi || 1) === d);
      membersInDoi.sort((a, b) => {
        // Lấy vị trí của cha/mẹ sinh thành trong danh sách tổng để đảm bảo cha sinh trước đứng trước
        let parentA = result.find(n => n.key === a.parentKey);
        let parentB = result.find(n => n.key === b.parentKey);
        
        if (parentA && parentB && parentA.key !== parentB.key) {
          return result.indexOf(parentA) - result.indexOf(parentB);
        }
        // Nếu cùng cha, sắp xếp theo con thứ từ 1 đến n
        return (a.conThu || 1) - (b.conThu || 1);
      });
      finalSorted = finalSorted.concat(membersInDoi);
    }

    return finalSorted;
  };

  const sortedList = getGenealogySortedList(treeData);
  const selectedMember = findNode(treeData, selectedKey) || sortedList[0] || treeData[0];

  useEffect(() => {
    localStorage.setItem('GIA_PHA_PRO_DATA', JSON.stringify(treeData));
  }, [treeData]);

  useEffect(() => {
    if (selectedMember) {
      editForm.setFieldsValue({
        ...selectedMember,
        ngaySinh: selectedMember.ngaySinh ? dayjs(selectedMember.ngaySinh) : null,
        pn1_ngaySinh: selectedMember.pn1_ngaySinh ? dayjs(selectedMember.pn1_ngaySinh) : null,
        pn2_ngaySinh: selectedMember.pn2_ngaySinh ? dayjs(selectedMember.pn2_ngaySinh) : null,
      });
      setEditPn1Avatar(selectedMember.pn1_avatar || "");
      setEditPn2Avatar(selectedMember.pn2_avatar || "");
    }
  }, [selectedKey, treeData]);

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

  const fDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : 'Chưa rõ');

  const handleParentChange = (parentKey) => {
    const parent = findNode(treeData, parentKey);
    if (parent) {
      addForm.setFieldsValue({
        doi: parent.doi + 1,
        nhanhThu: parent.nhanhThu || 0,
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
        name: values.name,
        doi: newDoi,
        nhanhThu: values.nhanhThu || 0,
        conThu: values.conThu || 1,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : '',
        avatar: values.avatar || '',
        parentKey: values.parentKey,
        conOngName: parentNode ? parentNode.name : '',
        conBaName: '',
        tieuSu: values.tieuSu || '',
        pn1_name: values.pn1_name || '',
        pn1_ngaySinh: values.pn1_ngaySinh ? values.pn1_ngaySinh.format('YYYY-MM-DD') : '',
        pn1_avatar: addPn1Avatar,
        pn1_tieuSu: values.pn1_tieuSu || '',
        pn2_name: values.pn2_name || '',
        pn2_ngaySinh: values.pn2_ngaySinh ? values.pn2_ngaySinh.format('YYYY-MM-DD') : '',
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
      setSelectedKey(newKey);
      message.success('Đã thêm thành viên mới vào gia phả!');
      addForm.resetFields();
      setAddPn1Avatar("");
      setAddPn2Avatar("");
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi thêm thành viên!');
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
        ngaySinh: values.ngaySinh ? values.ngaySinh.format('YYYY-MM-DD') : '',
        pn1_ngaySinh: values.pn1_ngaySinh ? values.pn1_ngaySinh.format('YYYY-MM-DD') : '',
        pn2_ngaySinh: values.pn2_ngaySinh ? values.pn2_ngaySinh.format('YYYY-MM-DD') : '',
        pn1_avatar: editPn1Avatar,
        pn2_avatar: editPn2Avatar,
      };

      const updated = updateNodeInTree(treeData, selectedKey, formattedValues);
      setTreeData(updated);
      message.success('Đã cập nhật thay đổi thành công!');
    } catch (err) {
      console.error(err);
      message.error('Có lỗi xảy ra khi cập nhật!');
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
          if (newData.length > 0) {
            setSelectedKey(newData[0].key);
          }
          message.success('Đã xóa thành viên thành công!');
        } catch (err) {
          console.error(err);
          message.error('Có lỗi xảy ra khi xóa!');
        }
      }
    });
  };

  const exportWord = (scope) => {
    if (scope === 'single') {
      let i = selectedMember;
      let text = `BÁO CÁO CÁ NHÂN: ${i.name}\n=======================\n\n`;
      text += `+ Họ tên: ${i.name}\n`;
      text += ` - Vị trí: Đời thứ ${i.doi} | Nhánh thứ ${i.nhanhThu} | Con thứ ${i.conThu}\n`;
      text += ` - Ngày sinh: ${fDate(i.ngaySinh)}\n`;
      text += ` - Tiểu sử: ${i.tieuSu || 'Chưa rõ'}\n`;
      if (i.pn1_name) text += ` - Phối ngẫu 1: ${i.pn1_name} (NS: ${fDate(i.pn1_ngaySinh)}) - TS: ${i.pn1_tieuSu}\n`;
      if (i.pn2_name) text += ` - Phối ngẫu 2: ${i.pn2_name} (NS: ${fDate(i.pn2_ngaySinh)}) - TS: ${i.pn2_tieuSu}\n`;

      const blob = new Blob([text], { type: "application/msword;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `canhan_${i.name}.doc`;
      a.click();
      return;
    }

    const maxDoi = sortedList.reduce((max, item) => item.doi > max ? item.doi : max, 1);
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/1999/xhtml'>
      <head>
        <meta charset='utf-8'>
        <title>Thư Mục Gia Phả Họ Hoàng</title>
        <style>
          @page {
            size: A4 portrait;
            mso-page-orientation: portrait;
            margin: 1.5cm 1.5cm 1.5cm 3cm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14pt;
            line-height: 1.3;
          }
          .title-main {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            text-transform: uppercase;
          }
          .title-sub {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            text-transform: uppercase;
            margin-bottom: 15px;
          }
          .doi-header {
            font-weight: bold;
            font-size: 14pt;
            text-transform: uppercase;
            margin-top: 15px;
            margin-bottom: 5px;
          }
          .row-group {
            margin-bottom: 15px;
          }
          .child-cell {
            font-size: 9pt;
            font-family: 'Times New Roman', Times, serif;
            text-align: center;
            vertical-align: top;
            padding: 4px;
          }
          .footer {
            mso-element: footer;
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
          }
          .footer-line {
            border-top: 1px solid black;
            width: 100%;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="footer">
          <div class="footer-line"></div>
          <div>GIA PHẢ HỌ HOÀNG</div>
        </div>

        <div class="title-main">THƯ MỤC GIA PHẢ HỌ HOÀNG</div>
        <div class="title-sub">(TỪ ĐỜI 1 ĐẾN ĐỜI ${maxDoi})</div>
        <div style="text-align: center; margin-bottom: 20px;">---***---</div>
    `;

    const doi1Members = sortedList.filter(i => i.doi === 1);
    htmlContent += `<div class="doi-header">&#10046; ĐỜI THỨ 1</div>`;
    doi1Members.forEach(item => {
      let wifeStr = item.pn1_name ? ` - Vợ: ${item.pn1_name} (${item.pn1_ngaySinh ? dayjs(item.pn1_ngaySinh).format('YYYY') : ''})` : '';
      let nhanhStr = item.nhanhThu > 0 ? ` (Nhánh ${item.nhanhThu})` : '';
      htmlContent += `<div style="text-align: center; margin-bottom: 10px;">`;
      if (item.avatar) {
        htmlContent += `<img src="${item.avatar}" width="113" height="151" style="display:block; margin:0 auto 5px auto; object-fit:cover;" /><br/>`;
      }
      htmlContent += `[Con thứ ${item.conThu || 1}]<br/>`;
      htmlContent += `<strong>Họ tên:</strong> ${item.name} &nbsp;&nbsp; <strong>NS:</strong> ${fDate(item.ngaySinh)}${wifeStr}${nhanhStr}`;
      htmlContent += `</div>`;
    });

    for (let d = 2; d <= maxDoi; d++) {
      htmlContent += `<div class="doi-header">&#10046; ĐỜI THỨ ${d}</div>`;

      let parentsAtDoiMinus1 = [];
      const collectParents = (nodes) => {
        nodes.forEach(n => {
          if (n.doi === d - 1 && n.children && n.children.length > 0) {
            parentsAtDoiMinus1.push(n);
          }
          if (n.children) collectParents(n.children);
        });
      };
      collectParents(treeData);

      parentsAtDoiMinus1.sort((a, b) => sortedList.findIndex(x => x.key === a.key) - sortedList.findIndex(x => x.key === b.key));

      let pairIndex = 1;
      parentsAtDoiMinus1.forEach(parent => {
        let wifeName = parent.pn1_name ? parent.pn1_name : '';
        let children = parent.children;
        let sortedChildren = [...children].sort((a, b) => {
          if ((a.conThu || 1) !== (b.conThu || 1)) return (a.conThu || 1) - (b.conThu || 1);
          return sortedList.findIndex(x => x.key === a.key) - sortedList.findIndex(x => x.key === b.key);
        });

        htmlContent += `<div class="row-group">`;
        htmlContent += `   ${d}.${pairIndex}- Ông bà: ${parent.name}${wifeName ? ' - ' + wifeName : ''}, sinh hạ được ${sortedChildren.length} người con:<br/>`;

        htmlContent += `[`;
        sortedChildren.forEach((c, idx) => {
          htmlContent += `Con thứ ${c.conThu || (idx + 1)}`;
          if (idx < sortedChildren.length - 1) htmlContent += ` | `;
        });
        htmlContent += `]<br/>`;

        htmlContent += `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:5px;"><tr>`;
        sortedChildren.forEach(c => {
          let isFemale = c.name.includes('Thị') || c.name.includes('Nguyễn Thị') || c.name.includes('Trần Thị') || c.name.includes('Lê Thị') || c.name.includes('Phạm Thị') || c.name.includes('Đặng Thị');
          let spouseLabel = isFemale ? 'Chồng' : 'Vợ';
          let spouseName = c.pn1_name || '';
          let spouseNs = c.pn1_ngaySinh ? fDate(c.pn1_ngaySinh) : '';
          let nhanhText = c.nhanhThu > 0 ? `(Nhánh ${c.nhanhThu})` : '';

          htmlContent += `<td class="child-cell" width="${100 / sortedChildren.length}%">`;
          if (c.avatar) {
            htmlContent += `<img src="${c.avatar}" width="113" height="151" style="display:block; margin:0 auto 3px auto; object-fit:cover;" />`;
          }
          htmlContent += `Họ tên: ${c.name}<br/>`;
          htmlContent += `NS: ${fDate(c.ngaySinh)}<br/>`;
          if (spouseName) {
            htmlContent += `${spouseLabel}: ${spouseName}<br/>`;
            if (spouseNs) htmlContent += `NS: ${spouseNs}<br/>`;
          }
          if (nhanhText) htmlContent += `${nhanhText}`;
          htmlContent += `</td>`;
        });
        htmlContent += `</tr></table>`;
        htmlContent += `</div>`;
        pairIndex++;
      });
    }

    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/msword;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ThuMucGiaPhaHoHoang_Doi1_${maxDoi}.doc`;
    a.click();
    message.success('Đã kết xuất và tải file Word thành công!');
  };

  const tableColumns = [
    { title: 'Họ và Tên', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Đời thứ', dataIndex: 'doi', key: 'doi', align: 'center', render: (v) => <Tag color="blue">Đời {v}</Tag> },
    { title: 'Nhánh thứ', dataIndex: 'nhanhThu', key: 'nhanhThu', align: 'center', render: (v) => <Tag color="orange">Nhánh {v}</Tag> },
    { title: 'Con thứ', dataIndex: 'conThu', key: 'conThu', align: 'center', render: (v) => <Tag color="green">Con thứ {v}</Tag> }
  ];

  const filteredData = sortedList.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-100 p-3 text-xs">
      <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm mb-3">
        <Title level={4} className="m-0 text-blue-900 flex items-center gap-2">
          <ApartmentOutlined /> QUẢN LÝ GIA PHẢ DÒNG TỘC
        </Title>
        <Space>
          <Button type="primary" size="small" onClick={() => exportWord('all')}>Xuất Word Cả Dòng Họ</Button>
          <Button type="primary" size="small" className="bg-orange-600" onClick={() => exportWord('single')}>Xuất Word Cá Nhân</Button>
        </Space>
      </div>

      <Row gutter={10}>
        {/* COL 1: FORM THÊM THÀNH VIÊN MỚI */}
        <Col span={8}>
          <Card title="1. Thêm Thành Viên Mới (17 Tiêu Chí)" size="small" className="shadow-sm">
            <Form form={addForm} layout="vertical" onFinish={onFinishAdd} initialValues={{ conThu: 1, nhanhThu: 0 }}>
              <Form.Item name="parentKey" label="Chọn Cha tiền bối" rules={[{ required: true, message: 'Vui lòng chọn Cha tiền bối' }]}>
                <Select
                  size="small"
                  placeholder="Chọn người sinh thành..."
                  onChange={handleParentChange}
                  options={sortedList.map(item => ({ label: `${item.name} (Đời ${item.doi} - Nhánh ${item.nhanhThu})`, value: item.key }))}
                />
              </Form.Item>

              <Row gutter={4}>
                <Col span={12}>
                  <Form.Item name="name" label="Họ và Tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                    <Input size="small" placeholder="Tên thành viên..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="ngaySinh" label="Ngày sinh">
                    <DatePicker size="small" format="DD/MM/YYYY" className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={4}>
                <Col span={8}>
                  <Form.Item name="doi" label="Đời thứ"><InputNumber size="small" className="w-full" disabled /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="nhanhThu" label="Nhánh thứ"><InputNumber size="small" className="w-full" min={0} /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="conThu" label="Con thứ"><InputNumber size="small" className="w-full" min={1} /></Form.Item>
                </Col>
              </Row>

              <Form.Item name="tieuSu" label="Tiểu sử cá nhân">
                <TextArea rows={1} size="small" placeholder="Tóm tắt tiểu sử..." />
              </Form.Item>

              <Form.Item label="Nhập ảnh cá nhân">
                <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => addForm.setFieldsValue({ avatar: url }))} />
                <Form.Item name="avatar" noStyle><Input type="hidden" /></Form.Item>
              </Form.Item>

              <Tabs size="small" type="card" items={[
                {
                  key: 'pn1', label: 'Phối Ngẫu 1', children: (
                    <div className="bg-slate-50 p-2 border rounded">
                      <Form.Item name="pn1_name" label="Tên Người Phối Ngẫu 1"><Input size="small" /></Form.Item>
                      <Form.Item name="pn1_ngaySinh" label="Ngày Sinh PN 1"><DatePicker size="small" format="DD/MM/YYYY" className="w-full" /></Form.Item>
                      <Form.Item name="pn1_tieuSu" label="Tiểu Sử PN 1"><Input size="small" /></Form.Item>
                      
                      <div className="flex justify-center mb-2">
                        <Avatar size={50} src={addPn1Avatar} icon={<UserOutlined />} className="shadow border" />
                      </div>

                      <Form.Item label="Nhập ảnh cá nhân PN 1">
                        <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { addForm.setFieldsValue({ pn1_avatar: url }); setAddPn1Avatar(url); })} />
                        <Form.Item name="pn1_avatar" noStyle><Input type="hidden" /></Form.Item>
                      </Form.Item>
                    </div>
                  )
                },
                {
                  key: 'pn2', label: 'Phối Ngẫu 2', children: (
                    <div className="bg-slate-50 p-2 border rounded">
                      <Form.Item name="pn2_name" label="Tên Người Phối Ngẫu 2"><Input size="small" /></Form.Item>
                      <Form.Item name="pn2_ngaySinh" label="Ngày Sinh PN 2"><DatePicker size="small" format="DD/MM/YYYY" className="w-full" /></Form.Item>
                      <Form.Item name="pn2_tieuSu" label="Tiểu Sử PN 2"><Input size="small" /></Form.Item>
                      
                      <div className="flex justify-center mb-2">
                        <Avatar size={50} src={addPn2Avatar} icon={<UserOutlined />} className="shadow border" />
                      </div>

                      <Form.Item label="Nhập ảnh cá nhân PN 2">
                        <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { addForm.setFieldsValue({ pn2_avatar: url }); setAddPn2Avatar(url); })} />
                        <Form.Item name="pn2_avatar" noStyle><Input type="hidden" /></Form.Item>
                      </Form.Item>
                    </div>
                  )
                }
              ]} />

              <Divider className="my-2" />

              <div className="flex gap-2">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} block size="small" className="bg-blue-600">
                  Cập nhật
                </Button>
                <Button icon={<CloseOutlined />} block size="small" onClick={handleCancelAdd}>
                  Bỏ qua
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        {/* COL 2: SƠ ĐỒ DÒNG HỌ DẠNG BẢNG 4 CỘT */}
        <Col span={8}>
          <Card title="2. Sơ Đồ Cấu Trúc Dòng Họ (Bảng Biểu)" size="small" className="shadow-sm">
            <Input
              size="small"
              placeholder="Tìm kiếm theo tên..."
              prefix={<SearchOutlined />}
              className="mb-2"
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
              scroll={{ x: true, y: 420 }}
            />
          </Card>
        </Col>

        {/* COL 3: ĐIỀU CHỈNH THÔNG TIN CHI TIẾT */}
        <Col span={8}>
          <Card title="3. Điều Chỉnh Thông Tin Chi Tiết (17 Tiêu Chí)" size="small" className="shadow-sm border-t-4 border-t-blue-600">
            {selectedMember ? (
              <Form form={editForm} layout="vertical" onFinish={onFinishEdit}>
                <div className="flex justify-center mb-2">
                  <Avatar size={60} src={selectedMember.avatar} icon={<UserOutlined />} className="shadow border" />
                </div>

                <Row gutter={4}>
                  <Col span={12}>
                    <Form.Item name="name" label="Họ và Tên" rules={[{ required: true }]}>
                      <Input size="small" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="ngaySinh" label="Ngày sinh">
                      <DatePicker size="small" format="DD/MM/YYYY" className="w-full" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={4}>
                  <Col span={8}>
                    <Form.Item name="doi" label="Đời thứ"><InputNumber size="small" className="w-full" disabled /></Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="nhanhThu" label="Nhánh thứ"><InputNumber size="small" className="w-full" min={0} /></Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="conThu" label="Con thứ"><InputNumber size="small" className="w-full" min={1} /></Form.Item>
                  </Col>
                </Row>

                <Row gutter={4}>
                  <Col span={12}>
                    <Form.Item name="conOngName" label="Con ông"><Input size="small" /></Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="conBaName" label="Con bà"><Input size="small" /></Form.Item>
                  </Col>
                </Row>

                <Form.Item name="tieuSu" label="Tiểu sử cá nhân">
                  <TextArea rows={1} size="small" />
                </Form.Item>

                <Form.Item label="Đổi ảnh cá nhân">
                  <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => editForm.setFieldsValue({ avatar: url }))} />
                  <Form.Item name="avatar" noStyle><Input type="hidden" /></Form.Item>
                </Form.Item>

                <Tabs size="small" type="card" items={[
                  {
                    key: 'edit_pn1', label: 'Phối Ngẫu 1', children: (
                      <div className="bg-slate-50 p-2 border rounded">
                        <Form.Item name="pn1_name" label="Tên PN 1"><Input size="small" /></Form.Item>
                        <Form.Item name="pn1_ngaySinh" label="Ngày sinh PN 1"><DatePicker size="small" format="DD/MM/YYYY" className="w-full" /></Form.Item>
                        <Form.Item name="pn1_tieuSu" label="Tiểu sử PN 1"><Input size="small" /></Form.Item>
                        
                        <div className="flex justify-center mb-2">
                          <Avatar size={50} src={editPn1Avatar} icon={<UserOutlined />} className="shadow border" />
                        </div>

                        <Form.Item label="Đổi ảnh cá nhân PN 1">
                          <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { editForm.setFieldsValue({ pn1_avatar: url }); setEditPn1Avatar(url); })} />
                          <Form.Item name="pn1_avatar" noStyle><Input type="hidden" /></Form.Item>
                        </Form.Item>
                      </div>
                    )
                  },
                  {
                    key: 'edit_pn2', label: 'Phối Ngẫu 2', children: (
                      <div className="bg-slate-50 p-2 border rounded">
                        <Form.Item name="pn2_name" label="Tên PN 2"><Input size="small" /></Form.Item>
                        <Form.Item name="pn2_ngaySinh" label="Ngày sinh PN 2"><DatePicker size="small" format="DD/MM/YYYY" className="w-full" /></Form.Item>
                        <Form.Item name="pn2_tieuSu" label="Tiểu sử PN 2"><Input size="small" /></Form.Item>
                        
                        <div className="flex justify-center mb-2">
                          <Avatar size={50} src={editPn2Avatar} icon={<UserOutlined />} className="shadow border" />
                        </div>

                        <Form.Item label="Đổi ảnh cá nhân PN 2">
                          <input type="file" accept="image/*" className="text-xs w-full border rounded p-1 bg-white cursor-pointer" onChange={(e) => e.target.files[0] && handleAvatarRead(e.target.files[0], (url) => { editForm.setFieldsValue({ pn2_avatar: url }); setEditPn2Avatar(url); })} />
                          <Form.Item name="pn2_avatar" noStyle><Input type="hidden" /></Form.Item>
                        </Form.Item>
                      </div>
                    )
                  }
                ]} />

                <Divider className="my-2" />

                <div className="flex gap-2">
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="small" className="bg-blue-600 flex-1">
                    Cập nhật
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
        </Col>
      </Row>
    </div>
  );
}