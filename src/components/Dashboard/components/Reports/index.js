import React, { useEffect, useState } from 'react';
import { fetchGetRequest } from '../../../../utils';
import { Stack, Alert, AlertIcon, Spinner } from '@chakra-ui/core';

const Reports = ({ userId, idToken, newReport }) => {
  const [reports, setReports] = useState(undefined);

  useEffect(() => {
    if (newReport) {
      const { deviceId, name, reportType, text } = newReport;
      setReports(reports => [
        ...reports.slice(-4),
        { deviceId, name, reportType, text }
      ]);
    }
  }, [newReport]);

  const fetchReports = async (uid, token) => {
    if (uid && token) {
      let userReports = await fetchGetRequest(
        `/api/report?userId=${uid}`,
        token
      );
      setReports(userReports);
    } else {
      console.log('fetchReports error', uid, token);
    }
  };

  useEffect(() => {
    fetchReports(userId, idToken);
  }, [idToken, userId]);

  return (
    <>
      <Stack spacing={1}>
        {reports ? (
          reports.reverse().map((object, index) => {
            const { report, name } = object;
            const { reportType, text } = report;
            return (
              <Alert key={index} status={reportType}>
                <AlertIcon />
                {`${name}: ${text}`}
              </Alert>
            );
          })
        ) : (
          <Spinner size="xl" borderStyle="solid" />
        )}
      </Stack>
    </>
  );
};

export default Reports;
