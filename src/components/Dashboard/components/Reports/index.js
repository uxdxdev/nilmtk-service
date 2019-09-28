import React, { useEffect, useState } from 'react';
import { fetchGetRequest } from '../../../../utils';
import {
  Stack,
  Alert,
  AlertIcon,
  Spinner,
  Box,
  Heading
} from '@chakra-ui/core';

const Reports = ({ userId, idToken, newReport }) => {
  const [reports, setReports] = useState(undefined);

  useEffect(() => {
    if (newReport) {
      setReports(reports => [...reports.slice(-4), newReport]);
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
    <Box m={4} p={4} borderWidth="1px" rounded="lg">
      <Heading my={2}>Notifications</Heading>
      {reports ? (
        <Stack spacing={1}>
          {reports.reverse().map((report, index) => {
            const { reportType, text } = report;
            return (
              <Alert key={index} status={reportType} variant="left-accent">
                <AlertIcon />
                {`${text}`}
              </Alert>
            );
          })}
        </Stack>
      ) : (
        <Spinner size="xl" borderStyle="solid" />
      )}
    </Box>
  );
};

export default Reports;
