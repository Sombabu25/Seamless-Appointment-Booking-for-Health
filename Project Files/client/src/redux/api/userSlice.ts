import { apiSlice } from "./apiSlice";

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verifyUser: builder.query({
      query: (data) => ({
        url: `/users/verify-user/${data.userId}`,
        method: "GET",
      }),
    }),
    getAllUsers: builder.query({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      providesTags: ["Doctors"],
    }),
    getUser: builder.query({
      query: (data) => ({
        url: `/users/${data.userId}`,
        method: "GET",
      }),
    }),
    bookAppointment: builder.mutation({
      query: (data) => ({
        url: "/users/book-appointment",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Doctors"],
    }),
    uploadDocuments: builder.mutation({
      query: (data) => ({
        url: "/users/upload-document",
        method: "POST",
        body: data,
      }),
    }),
    userAppointments: builder.query({
      query: (data) => ({
        url: `/users/user-appointments/${data.userId}`,
        method: "GET",
      }),
      providesTags: ["Doctors"],
    }),
    cancelAppointment: builder.mutation({
      query: (data) => ({
        url: `/users/appointments/${data.appointmentId}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["Doctors"],
    }),
    rescheduleAppointment: builder.mutation({
      query: (data) => ({
        url: `/users/appointments/${data.appointmentId}/reschedule`,
        method: "PATCH",
        body: data.body,
      }),
      invalidatesTags: ["Doctors"],
    }),
    deleteUser: builder.mutation({
      query: (data) => ({
        url: `/users/${data.userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Doctors"],
    }),
  }),
});

export const {
  useVerifyUserQuery,
  useGetAllUsersQuery,
  useGetUserQuery,
  useBookAppointmentMutation,
  useUploadDocumentsMutation,
  useUserAppointmentsQuery,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
  useDeleteUserMutation,
} = userApiSlice;
