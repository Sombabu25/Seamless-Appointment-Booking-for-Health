import { useState } from "react";
import { Heading, SubHeading } from "../../components/Heading";
import MUITable, {
  StyledTableCell,
  StyledTableRow,
} from "../../components/MUITable";
import Navbar from "../../components/Navbar";
import OverlayLoader from "../../components/Spinner/OverlayLoader";
import useTypedSelector from "../../hooks/useTypedSelector";
import { formatDate, formatTime, maskingPhoneNumber } from "../../utils";
import {
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
  useUserAppointmentsQuery,
} from "../../redux/api/userSlice";
import { selectedUserId } from "../../redux/auth/authSlice";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import CustomChip from "../../components/CustomChip";
import { IoBookOutline } from "react-icons/io5";
import DatePicker from "../../components/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import ToastAlert from "../../components/ToastAlert/ToastAlert";

const tableHead = ["Id", "Doctor", "Phone", "Date", "Status", "Actions"];

const Appointments = () => {
  const userId = useTypedSelector(selectedUserId);

  const { data, isLoading, isSuccess } = useUserAppointmentsQuery({
    userId,
  });

  const [cancelAppointment, { isLoading: cancelLoading }] =
    useCancelAppointmentMutation();
  const [rescheduleAppointment, { isLoading: rescheduleLoading }] =
    useRescheduleAppointmentMutation();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<any>(null);
  const [rescheduleTime, setRescheduleTime] = useState<any>(null);
  const [toast, setToast] = useState({
    message: "",
    appearence: false,
    type: "",
  });

  const handleCloseToast = () => {
    setToast({ ...toast, appearence: false });
  };

  const openRescheduleModal = (row: any) => {
    setSelectedAppointment(row);
    setRescheduleDate(dayjs(row?.date));
    setRescheduleTime(dayjs(row?.time));
    setRescheduleOpen(true);
  };

  const closeRescheduleModal = () => {
    setRescheduleOpen(false);
  };

  const handleCancel = async (appointmentId: string) => {
    const response: any = await cancelAppointment({ appointmentId });
    if (response?.data?.status) {
      setToast({
        ...toast,
        message: response.data.message,
        appearence: true,
        type: "success",
      });
    } else {
      setToast({
        ...toast,
        message: response?.error?.data?.message || "Failed to cancel appointment",
        appearence: true,
        type: "error",
      });
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment?._id) return;
    const response: any = await rescheduleAppointment({
      appointmentId: selectedAppointment._id,
      body: { date: rescheduleDate, time: rescheduleTime },
    });

    if (response?.data?.status) {
      setToast({
        ...toast,
        message: response.data.message,
        appearence: true,
        type: "success",
      });
      setRescheduleOpen(false);
    } else {
      setToast({
        ...toast,
        message:
          response?.error?.data?.message || "Failed to reschedule appointment",
        appearence: true,
        type: "error",
      });
    }
  };

  return (
    <>
      {isLoading && <OverlayLoader />}

      <Navbar>
        <Heading>Appointments</Heading>
        <Box
          sx={{
            margin: "20px 0",
          }}
          className="card-surface accent-border"
        >
          <MUITable tableHead={tableHead}>
            {isSuccess && data.data.length > 0 ? (
              data.data.map((row: any) => (
                <StyledTableRow key={row._id}>
                  <StyledTableCell>{row._id}</StyledTableCell>
                  <StyledTableCell>{`${row.doctorInfo?.prefix} ${row.doctorInfo?.fullName}`}</StyledTableCell>
                  <StyledTableCell>
                    {maskingPhoneNumber(row?.doctorInfo?.phoneNumber)}
                  </StyledTableCell>
                  <StyledTableCell>{`${formatDate(row?.date)} ${formatTime(
                    row?.time
                  )}`}</StyledTableCell>
                  <StyledTableCell>
                    <CustomChip
                      label={
                        row.status === "pending"
                          ? "Pending"
                          : row.status === "approved"
                          ? "Approved"
                          : row.status === "rejected"
                          ? "Rejected"
                          : row.status === "cancelled"
                          ? "Cancelled"
                          : row.status === "rescheduled"
                          ? "Rescheduled"
                          : ""
                      }
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    {["pending", "approved", "rescheduled"].includes(
                      row.status
                    ) ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={cancelLoading}
                          onClick={() => handleCancel(row._id)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={rescheduleLoading}
                          onClick={() => openRescheduleModal(row)}
                        >
                          Reschedule
                        </Button>
                      </Box>
                    ) : (
                      "-"
                    )}
                  </StyledTableCell>
                </StyledTableRow>
              ))
            ) : (
              <StyledTableRow>
                <StyledTableCell
                  sx={{ height: "100px" }}
                  colSpan={tableHead?.length}
                  align="center"
                >
                  <Box
                    sx={{
                      fontSize: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <IoBookOutline />
                    {data?.data?.length === 0 ? "No records found" : ""}
                  </Box>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </MUITable>
        </Box>
      </Navbar>
      <Dialog open={rescheduleOpen} onClose={closeRescheduleModal} fullWidth>
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ marginTop: "10px" }}>
            <SubHeading sx={{ marginBottom: "5px" }}>Select Date</SubHeading>
            <DatePicker
              label=""
              minDate={new Date()}
              value={rescheduleDate}
              handleChange={(value: any) => setRescheduleDate(value)}
            />
          </Box>
          <Box sx={{ marginTop: "10px" }}>
            <SubHeading sx={{ marginBottom: "5px" }}>Select Time</SubHeading>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label=""
                value={rescheduleTime}
                onChange={(value) => setRescheduleTime(value)}
                renderInput={(params) => (
                  <TextField sx={{ width: "100%" }} {...params} />
                )}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRescheduleModal}>Close</Button>
          <Button
            variant="contained"
            onClick={handleReschedule}
            disabled={rescheduleLoading}
          >
            {rescheduleLoading ? "Rescheduling..." : "Reschedule"}
          </Button>
        </DialogActions>
      </Dialog>
      <ToastAlert
        appearence={toast.appearence}
        type={toast.type}
        message={toast.message}
        handleClose={handleCloseToast}
      />
    </>
  );
};

export default Appointments;
