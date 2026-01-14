package com.five.birthdays.api;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Month;
import java.util.List;

import com.five.Routes;
import com.five.core.BaseServlet;

@WebServlet(Routes.birthdays.api.root)
public class BirthdaysAPIServlet extends BaseServlet {
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        writeObject(response, "birthdays", List.of(
                new Birthday("Alice", Month.JANUARY.getValue(), 1),
                new Birthday("Bob", Month.FEBRUARY.getValue(), 2),
                new Birthday("Charlie", Month.MARCH.getValue(), 3)));
    }

    public record Birthday(String name, int month, int date) {
    }
}
