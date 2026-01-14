package com.five.core;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public abstract class BaseEndpoint extends BaseServlet {

    private String path;

    public BaseEndpoint(String path) {
        this.path = path;
    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        if (request.getPathInfo().equals("/index.jsp")) {
            forwardTo(request, response, "index.jsp");
        } else {
            String id = request.getPathInfo().substring(1);
            // set the id as a parameter in the request
            request.setAttribute("resource", id);
            forwardTo(request, response, path);
        }
    }
}
