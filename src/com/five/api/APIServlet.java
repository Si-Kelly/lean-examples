package com.five.api;

import java.io.IOException;
import java.io.PrintWriter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.five.Routes;

@WebServlet(Routes.api.root)
public class APIServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    public APIServlet() {
        super();
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/javascript");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        out.print("export const contextPath = '" + request.getContextPath() + "';");
        out.flush();
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        doGet(request, response);
    }
}