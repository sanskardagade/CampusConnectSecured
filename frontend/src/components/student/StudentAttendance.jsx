import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Select, Space, Button, Spin, message } from 'antd';
import api from '../../api/api.js';

const AttendanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [details, setDetails] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchAttendanceSummary();
    fetchAttendanceDetails();
  }, [selectedSubject, pagination.current]);

  const fetchAttendanceSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('http://localhost:5000/api/studentAttendance/summary');
      setSummary(response.data.data);
    } catch (error) {
      message.error('Failed to fetch attendance summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceDetails = async () => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const offset = (current - 1) * pageSize;
      
      const params = {
        limit: pageSize,
        offset,
        ...(selectedSubject && { subjectId: selectedSubject })
      };
      
      const response = await api.get('http://localhost:5000/api/details', { params });
      setDetails(response.data.data);
      
      // Update total count if available from the API
      // setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      message.error('Failed to fetch attendance details');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'session_date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => `${record.start_time} - ${record.end_time}`
    },
    {
      title: 'Subject',
      dataIndex: 'subject_name',
      key: 'subject'
    },
    {
      title: 'Faculty',
      dataIndex: 'faculty_name',
      key: 'faculty'
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Status',
      key: 'status',
      render: () => 'Present' // Assuming all records in details are for attended sessions
    }
  ];

  return (
    <div className="attendance-dashboard">
      <h2>Attendance Overview</h2>
      
      <Card title="Attendance Summary" loading={loading}>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by subject"
            style={{ width: 300 }}
            allowClear
            onChange={setSelectedSubject}
            options={summary.map(item => ({
              value: item.subjectId,
              label: item.subjectName
            }))}
          />
        </div>
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {summary.map(item => (
            <div key={item.subjectId}>
              <h4>{item.subjectName}</h4>
              <Progress
                percent={item.percentage}
                status={item.percentage < 75 ? 'exception' : 'success'}
                format={percent => `${percent}% (${item.attendedSessions}/${item.totalSessions})`}
              />
            </div>
          ))}
        </Space>
      </Card>
      
      <Card title="Attendance Details" style={{ marginTop: 24 }} loading={loading}>
        <Table
          columns={columns}
          dataSource={details}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default AttendanceDashboard;