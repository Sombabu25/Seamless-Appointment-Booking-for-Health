// React Imports
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// Utils
import {
  convertToAMPMFormat,
  maskingPhoneNumber,
  thousandSeparatorNumber,
} from "../../utils";
// React Icons
import { IoPhonePortraitOutline } from "react-icons/io5";
import { CiLocationOn } from "react-icons/ci";
import { CiMoneyCheck1 } from "react-icons/ci";
import { IoMdTime } from "react-icons/io";
// MUI Imports
import { Box, Grid, Divider, TextField, MenuItem, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
// Custom Imports
import { Heading } from "../../components/Heading";
import Navbar from "../../components/Navbar";
import { useGetApprovedDoctorsQuery } from "../../redux/api/doctorSlice";
import OverlayLoader from "../../components/Spinner/OverlayLoader";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetApprovedDoctorsQuery({});
  const [filters, setFilters] = useState({
    specialization: "",
    location: "",
    time: null as any,
  });

  const specializations = useMemo<string[]>(() => {
    const values = data?.data?.map((item: any) => item.specialization) || [];
    return Array.from(new Set(values))
      .filter((value): value is string => Boolean(value));
  }, [data]);

  const filteredDoctors = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((row: any) => {
      if (filters.specialization && row.specialization !== filters.specialization) {
        return false;
      }
      if (
        filters.location &&
        !row.address?.toLowerCase().includes(filters.location.toLowerCase())
      ) {
        return false;
      }
      if (filters.time) {
        const selected = dayjs(filters.time).valueOf();
        const from = dayjs(row.fromTime).valueOf();
        const to = dayjs(row.toTime).valueOf();
        if (Number.isNaN(selected) || selected < from || selected > to) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters]);

  return (
    <>
      {isLoading && <OverlayLoader />}
      <Navbar>
        <Heading>Available Doctors</Heading>
        {data?.data?.length !== 0 && (
          <Heading sx={{ margin: "10px 0", fontSize: "14px", fontWeight: 500 }}>
            Select Doctor to add Appointments
          </Heading>
        )}

        <Box
          sx={{
            margin: "15px 0 5px 0",
            borderRadius: "6px",
            padding: "15px 20px",
          }}
          className="card-surface accent-border"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Specialization"
                select
                fullWidth
                value={filters.specialization}
                onChange={(e) =>
                  setFilters({ ...filters, specialization: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                {specializations.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Location"
                fullWidth
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Availability Time"
                  value={filters.time}
                  onChange={(value) => setFilters({ ...filters, time: value })}
                  renderInput={(params) => (
                    <TextField fullWidth {...params} />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: "56px" }}
                onClick={() =>
                  setFilters({ specialization: "", location: "", time: null })
                }
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Grid container rowSpacing={2} columnSpacing={4}>
            {filteredDoctors.length === 0 ? (
              <Box
                sx={{
                  margin: "30px 0 20px 0",
                  borderRadius: "6px",
                  padding: "15px 20px",
                }}
                className="card-surface accent-border"
              >
                No Doctors Available in this Clinic
              </Box>
            ) : (
              <>
                {filteredDoctors.map((row: any) => {
                  return (
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          margin: "20px 0",
                          borderRadius: "6px",
                          padding: "15px 20px",
                          cursor: "pointer",
                          "&:hover": {
                            border: "2px solid rgba(47, 123, 255, 0.35)",
                          },
                        }}
                        className="card-surface accent-border"
                        onClick={() => {
                          navigate(`/book-appointments/${row?.userId}`);
                        }}
                      >
                        <Heading
                          sx={{
                            margin: "5px 0",
                            fontSize: "18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          {`${row?.prefix} ${row?.fullName}`}
                          <Box sx={{ fontSize: "14px" }}>
                            {`(${row?.specialization})`}
                          </Box>
                        </Heading>
                        <Divider />
                        <Box
                          sx={{
                            margin: "15px 0 10px 0",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: "180px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <IoPhonePortraitOutline />
                            Phone Number
                          </Box>
                          <Box>{maskingPhoneNumber(row?.phoneNumber)}</Box>
                        </Box>
                        <Box
                          sx={{
                            margin: "15px 0 10px 0",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: "180px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <CiLocationOn />
                            Address
                          </Box>
                          <Box>{row?.address}</Box>
                        </Box>
                        <Box
                          sx={{
                            margin: "15px 0 10px 0",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: "180px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <CiMoneyCheck1 /> Fee Per Visit
                          </Box>
                          <Box>
                            {thousandSeparatorNumber(row?.feePerConsultation)}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            margin: "15px 0 10px 0",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              minWidth: "180px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <IoMdTime />
                            Timings
                          </Box>
                          <Box>{`${convertToAMPMFormat(
                            row?.fromTime
                          )} to ${convertToAMPMFormat(row?.toTime)}`}</Box>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </>
            )}
          </Grid>
        </Box>
      </Navbar>
    </>
  );
};

export default Dashboard;
